$(function() {
    $.get("api/viewdataanalysis" + window.location.search, function(data) {
        $('#loadingNotice').remove();
        console.log(data);
        plotData(data.counts.date_week.map(x => x[1]), 'chart1')
        //plotValueSortedData(data.counts.date_day, 'chart1')
    });
});

function plotData(data, id) {
    var plot1 = $.jqplot(id, [data]);
}

function plotValueSortedData(data, id) {
    data = data.map(x => x[1]);
    data.sort((a, b) => b - a);
    var plot1 = $.jqplot(id, [data]);
}