$(document).ready(function () {
    datas = [];

    el = $('.grid-view');
    columns = buildColumns();
    data = buildData(columns);
    el.children().remove();
    el.bootstrapTable('destroy').bootstrapTable({
        columns,
        data,
        search: true,
    })
})

/**
 * Get the slug by string
 * @param {String} string
 * @returns {String}
 */
function slug(string) {
    return string.replace(/[-+\s\/\\]/g, '_').toLowerCase();
}

/**
 * Check string include chinese or not
 * @param {string} string 
 * @returns {boolean}
 */
function includesChinese(string) {
    return /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uffef]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/.test(string);
}

/**
 * Encode chinese to unicode
 * @param {String} string 
 * @returns {String}
 */
function encodeUnicode(string) {
    let result = "";
    for (let i = 0; i < string.length; i++) {
        result += string.charCodeAt(i).toString(16).padStart(4, '0');
    }
    return result;
}

/**
 * Build columns by title list
 * @returns {Array}
 */
function buildColumns() {
    columns = [];
    test = $('.grid-view thead tr:first-child th').toArray()
    test.forEach(element => {
        console.log(element.innerText)
    })

    $('.grid-view thead tr:first-child th').toArray().forEach(function (element) {
        column = {};
        string = slug(element.innerText);
        column['field'] = includesChinese(string) ? encodeUnicode(string) : string;
        column['title'] = string;
        column['sortable'] = /href/.test(element.innerHTML) ? true : false;
        column['valign'] = 'middle';
        column['formatter'] = function (val) {
            return '<div class="item" style="text-align: center; width: 5rem;">' + val + '</div>';
        };

        columns.push(column);
    })
    return columns;
}

/**
 * Fetch data and build with title
 * @param {Array} columnList
 * @returns {Array}
 */
function buildData(columnList) {
    datas = [];
    $('.grid-view tbody tr').each(function () {
        data = {};
        $(this).children('td').each(function (index, element) {
            data[columnList[index]['field']] = element.innerHTML;
        })
        datas.push(data);
    })

    return datas;
}
