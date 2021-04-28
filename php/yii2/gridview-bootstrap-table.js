$( document ).ready(function() {
    datas = [];

    titleList = getTitleList();

    columns = buildColumns(titleList);
    data = buildData(titleList);

    $('.grid-view').children().remove();
    $('.grid-view').bootstrapTable('destroy').bootstrapTable({
        columns,
        data,
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
 * Fetch title from gridview
 * @returns {String[]}
 */
function getTitleList() {
    return $('.card-body thead tr:first-child').children('th').map(function () {
        return slug(this.innerHTML);
    }).get();
}

/**
 * Build columns by title list
 * @param {String[]} titleList
 * @param {boolean} sortable
 * @param {String} valign
 * @returns {Array}
 */
function buildColumns(titleList, sortable = false, valign = 'middle') {
    columns = [];
    titleList.forEach(function(string) {
        column = {};
        column['field'] = string;
        column['title'] = string;
        column['sortable'] = sortable;
        column['valign'] = 'middle';
        column['formatter'] = function (val) {
            return '<div class="item" style="text-align: center;">' + val + '</div>';
        };

        columns.push(column);
    })
    return columns;
}

/**
 * Fetch data and build with title
 * @param {String[]} titleList
 * @returns {Array}
 */
function buildData(titleList) {
    datas = [];
    $('.card-body tbody tr').each(function () {
        data = {};
        $(this).children('td').each(function(index, element) {
            data[titleList[index]] = element.innerHTML;
        })
        datas.push(data);
    })

    return datas;
}
