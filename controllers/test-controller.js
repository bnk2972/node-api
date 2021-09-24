const { expressHandler } = require("@controllers/express-handler")

async function test(request, response) {
    const { menu_id } = request.body
    if (!menu_id) return { code: 400 }
    else return { code: 200 }
}

async function getMenuListHandler (request) {
    let { active, cateActive, sortBy, orderBy, pageSize, startAt, searchBy, filterText, invusegFlag, view_type } = querystring(request.query)
    let { branch_id } = partparam(request.params)

    let query = `
    SELECT
    tm.menu_id,
    tm.image_key,
    tm.name as menu_name,
    tm.name2 as menu_name2,
    tm.description,
    tm.code,
    tm.price,
    tm.delete_flag,
    tm.create_dt,
    tm.create_dt,
    tm.recommended,
    tm.seasonal_flag,
    tm.take_time_flag,
    tm.delivery_flag,
    tm.out_of_stock_flag,
    tm.var_price_flag,
    tm.is_non_vat,
    tmg.menu_group_id as category_id,
    tmg.menu_group_name as category_name,
    tmg.menu_group_id as category_id,
    tcg.name as menu_group_name,
    tt.template_id,
    array_agg(tmog.option_group_id) as option_links
FROM
    tbl_menu tm
LEFT JOIN tbl_template tt ON tt.menu_id = tm.menu_id AND tt.delete_flag = 0
LEFT JOIN tbl_menu_group tmg ON tmg.menu_group_id = tt.menu_group_id
LEFT JOIN tbl_category_group tcg ON tcg.cat_grp_id = tmg.cat_grp_id AND tcg.delete_flag = 0
LEFT JOIN tbl_menu_option_group tmog ON tmog.menu_id = tm.menu_id AND tmog.delete_flag = 0
        WHERE tm.branch_id = ${branch_id}
    `

    if (active == 1) {
        query += ` AND tm.delete_flag = 0`
    } else if (active == 0) {
        query += ` AND tm.delete_flag = 1`
    }

    if (cateActive == 1) {
        query += ` AND tt.template_id IS NOT NULL`
    } else if (cateActive == 0) {
        query += ` AND tt.template_id IS NULL`
    }

    let filterAll =  [
        { field: 'menu_name', column: "tm.name"  },
        { field: 'menu_name2',  column: "tm.name2" },
        { field: 'code', column: "tm.code" },
        { field: 'category_name', column: "tmg.menu_group_name" },
        { field: 'menu_group_name', column: "tcg.name" }
    ]

    if(searchBy == 'all'){
        searchBy = filterAll
    }else{
        searchBy = filterAll.filter(item =>{
            return item.field == searchBy
        })
    }

    query += await searchQuery(searchBy, filterText)
    query += ` GROUP BY tm.menu_id,tmg.menu_group_id,tcg.name,tt.template_id `

    const client = await connectDB()
    try {
        await client.connect()
        // นับ row
        let resultData  = await client.query(query)
        let totalRows   = resultData.rowCount

        if (view_type == 'GRID_VIEW') {
            sortBy = 'menu_name' 
        }
        
        query += sortQuery(sortBy ? sortBy : 'tm.menu_id', orderBy ? orderBy : 'ASC', pageSize, startAt)
        resultData = await client.query(query)

    if( invusegFlag == 1 ){
    
        let menu_ids = resultData.rows.map(item =>{
            return item.menu_id
        })
        
    let queryInvUsedList = `SELECT 
                                oiu.menu_id,
                                oiu.opt_inv_used_id, 
                                oiu.option_inventory_id,
                                oiu.display_unit_id, 
                                oiu.option_group_id,
                                oiu.used_value, 
                                o.option_type,
                                oi.option_id,
                                inv.inventory_id,
                                inv.name as inventory_name,
                                inv.inventory_unit_id as base_unit,
                                miu.ab_name
                            FROM tbl_option_inventory_used oiu
                            INNER JOIN tbl_option_inventory oi ON oiu.option_inventory_id = oi.option_inventory_id AND oiu.delete_flag = 0 AND oi.delete_flag = 0
                            INNER JOIN tbl_option o ON o.option_id = oi.option_id AND o.delete_flag = 0 AND oi.delete_flag = 0
                            LEFT JOIN tbl_inventory inv ON inv.inventory_id = oi.inventory_id
                            LEFT JOIN tbl_mt_inventory_unit miu ON miu.inventory_unit_id = oiu.display_unit_id
                            WHERE oiu.menu_id IN (${menu_ids})`


    let resultInvUsedList = await client.query(queryInvUsedList)
    let invUsedList = [];
    for(let item of resultInvUsedList.rows){
            // convert used value to display
            if (item.option_type == 2) {
                invUsedList.push({
                  menu_id: item.menu_id,
                  option_inventory_used_id: item.opt_inv_used_id || '',
                  option_inventory_id: item.option_inventory_id || '',
                  display_unit_id: item.display_unit_id || '',
                  option_group_id: item.option_group_id || ''
                })
            }
    }

    resultData.rows.map(item=>{
        item.opt_inv_used_list = invUsedList.filter(item2=>{
            return item2.menu_id == item.menu_id
        }) 
    })
    }
    
    return {
        data: resultData.rows,
        totalRows: totalRows
    }
    } catch (err) {
        console.log(err);
        
        throw new Error('Error Something')
    } finally {
        await client.end()
    }
}

async function getMenuHandler (request) {
    
    let { menu_id,branch_id } = partparam(request.params)
    let queryMenu = `
        SELECT m.menu_id, m.name, m.name2, m.var_price_flag, m.price, m.code, m.barcode, m.description,
            m.color_code_blue, m.color_code_green, m.color_code_red,
            m.delivery_flag, m.out_of_stock_flag, m.take_time_flag, m.seasonal_flag,m. recommended,
            m.image_key, m.is_non_vat, mg.menu_group_id category_id, cg.cat_grp_id group_id,
            m.var_price_flag
        FROM tbl_menu m
        LEFT JOIN tbl_template tem ON tem.menu_id = m.menu_id AND tem.delete_flag = 0 AND m.delete_flag = 0
        LEFT JOIN tbl_menu_group mg ON mg.menu_group_id = tem.menu_group_id AND mg.delete_flag = 0 AND tem.delete_flag = 0
        LEFT JOIN tbl_category_group cg ON mg.cat_grp_id = cg.cat_grp_id AND cg.delete_flag = 0 AND mg.delete_flag = 0
        WHERE m.menu_id = ${parseInt(menu_id)}
    `

    const client = await connectDB()
    await client.connect()
    const result = await client.query(queryMenu)
    const itemMenu = result.rows[0]
    let menu = {
        menu_id: itemMenu.menu_id,
        menu_name: itemMenu.name,
        menu_name_2: itemMenu.name2 || '',
        menu_price: itemMenu.price || '',
        var_price_flag: Number(itemMenu.var_price_flag || 0),
        code: itemMenu.code || '',
        barcode: itemMenu.barcode || '',
        description: itemMenu.description || '',
        color_code_blue: itemMenu.color_code_blue || '',
        color_code_green: itemMenu.color_code_green || '',
        color_code_red: itemMenu.color_code_red || '',
        delivery_flag: itemMenu.delivery_flag || '',
        out_of_stock_flag: itemMenu.out_of_stock_flag || '',
        take_time_flag: itemMenu.take_time_flag || '',
        seasonal_flag: itemMenu.seasonal_flag || '',
        recommended: itemMenu.recommended || 0,
        image_key: itemMenu.image_key,
        is_non_vat: itemMenu.is_non_vat || '',
        group_id: itemMenu.group_id || '',
        category_id: itemMenu.category_id || '',
        option_group_list: [],
        ingredient_list: [],
        opt_inv_used_list: [],
        ingre_inv_used_list: [],
        channel_sale_list: []
    }

    let queryOptionGroupList = `
        SELECT mog.option_group_id
        FROM tbl_menu_option_group mog
        INNER JOIN tbl_option_group og ON mog.option_group_id = og.option_group_id AND mog.delete_flag = 0 AND og.delete_flag = 0
            AND og.option_group_type = 2
        WHERE mog.menu_id = ${parseInt(menu_id)}
    `

    let resultOptionGroupList = await client.query(queryOptionGroupList)
    let optionGroupList = resultOptionGroupList.rows
    menu.option_group_list = optionGroupList.map(item => item.option_group_id)

    let queryIngreInvUsedList = `SELECT o.option_id
                                 FROM tbl_menu_option_group mog
                                 INNER JOIN tbl_option_group og ON mog.option_group_id = og.option_group_id AND mog.delete_flag = 0 AND og.delete_flag = 0 AND og.option_group_type = 0
                                 INNER JOIN tbl_option_group_map ogm ON og.option_group_id = ogm.option_group_id AND og.delete_flag = 0 AND ogm.delete_flag = 0
                                 INNER JOIN tbl_option o ON o.option_id = ogm.option_id AND o.delete_flag = 0 AND ogm.delete_flag = 0
                                 WHERE mog.menu_id = ${parseInt(menu_id)}`

    let resultIngreInvUsedList = await client.query(queryIngreInvUsedList)
    let ingreInvUsedList = resultIngreInvUsedList.rows
    menu.ingredient_list = ingreInvUsedList.map(item => item.option_id)

    let queryInvUsedList = `SELECT 
                                oiu.opt_inv_used_id, 
                                oiu.option_inventory_id,
                                oiu.display_unit_id, 
                                oiu.option_group_id,
                                oiu.used_value, 
                                o.option_type,
                                oi.option_id,
                                inv.inventory_id,
                                inv.name as inventory_name,
                                inv.inventory_unit_id as base_unit,
                                miu.ab_name
                            FROM tbl_option_inventory_used oiu
                            INNER JOIN tbl_option_inventory oi ON oiu.option_inventory_id = oi.option_inventory_id AND oiu.delete_flag = 0 AND oi.delete_flag = 0
                            INNER JOIN tbl_option o ON o.option_id = oi.option_id AND o.delete_flag = 0 AND oi.delete_flag = 0
                            LEFT JOIN tbl_inventory inv ON inv.inventory_id = oi.inventory_id
                            LEFT JOIN tbl_mt_inventory_unit miu ON miu.inventory_unit_id = oiu.display_unit_id
                            WHERE oiu.menu_id = ${parseInt(menu_id)} AND oi.branch_id = ${branch_id}`
    let resultInvUsedList = await client.query(queryInvUsedList)
    let invUsedList = resultInvUsedList.rows
    
    for(let item of invUsedList){
    // invUsedList.forEach(item => {
        // convert used value to display
        let used_val = item.used_value

        if(item.display_unit_id && item.base_unit != item.display_unit_id ){
            // if base unit = kg g mg l ml
            if(item.base_unit == 9 && item.display_unit_id == 10) { used_val = used_val*1000 }
            else if(item.base_unit == 10 && item.display_unit_id == 9) { used_val = used_val/1000 }

            else if(item.base_unit == 11 && item.display_unit_id == 12) { used_val = used_val*1000 }
            else if(item.base_unit == 11 && item.display_unit_id == 13) { used_val = used_val*1000*1000 }

            else if(item.base_unit == 12 && item.display_unit_id == 11) { used_val = used_val/1000 }
            else if(item.base_unit == 12 && item.display_unit_id == 13) { used_val = used_val*1000 }

            else if(item.base_unit == 13 && item.display_unit_id == 11) { used_val = used_val/(1000*1000) }
            else if(item.base_unit == 13 && item.display_unit_id == 12) { used_val = used_val/1000 }
            else{
                // find in conv unit
                let conv_unit_value = await getInventoryConvValue(item.inventory_id, item.display_unit_id)
                used_val = used_val * parseFloat(conv_unit_value)
            }
        }

        if (item.option_type == 2) {
            menu.opt_inv_used_list.push({
              option_inventory_used_id: item.opt_inv_used_id || '',
              option_inventory_id: item.option_inventory_id || '',
              display_unit_id: item.display_unit_id || item.base_unit,
              option_group_id: item.option_group_id || '',
              used_value: used_val || ''
            })
        } else {
            menu.ingre_inv_used_list.push({
                option_inventory_used_id: item.opt_inv_used_id || '',
                option_inventory_id: item.option_inventory_id || '',
                display_unit_id: item.display_unit_id || item.base_unit,
                ingredient_id: item.option_id || '',
                used_value: used_val || '',
                inventory_name: item.inventory_name || '',
                display_unit_name: item.ab_name || ''
            })
        }
    }

    let sql = ` SELECT
                    cm.channel_menu_id,
                    c.channel_id,
                    c.name channel_name,
                    c.channel_default_id,
                    c.is_gp,
                    c.gp_percent,
                    COALESCE(cm.additional_price, 0.00) additional_price,
                    (SELECT m.var_price_flag FROM tbl_menu m WHERE m.menu_id = ${parseInt(menu_id)}) var_price_flag,
                    CASE WHEN cm.active_flag = 1 THEN
                        true
                    ELSE
                        false
                    END choose_flag
                FROM
                    tbl_channel c
                    LEFT JOIN tbl_channel_menu cm ON cm.channel_id = c.channel_id
                        AND cm.delete_flag = 0
                        AND cm.branch_id = ${branch_id}
                        AND cm.menu_id = ${parseInt(menu_id)}
                    LEFT JOIN tbl_channel_default cd ON cd.channel_default_id = c.channel_default_id AND cd.delete_flag = 0
                WHERE
                    c.delete_flag = 0
                    AND c.branch_id = ${branch_id}
                ORDER BY cd.seq, c.create_dt ASC
              `
    try {
        const result = await client.query(sql)
        menu.channel_sale_list = result.rows
    } catch (error) {
        console.log(error)
    }
    await client.end()
    return {
        success: 1,
        data: menu
    }
}

module.exports = {
    test: expressHandler({
        handler: test
    })
}