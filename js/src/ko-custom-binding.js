/** Custom binding to handle the drawing of the swell data with d3 */
ko.bindingHandlers.MSWswellChart = {
  /**
  * @description Creates custom Knockout.js binding. See Knockout.js
  * documentation at http://knockoutjs.com/documentation/custom-bindings.html
  */
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
    var margin = {top: 29, right: 0, bottom: 0, left: 0},
        width = 400,
        height = 200,
        data = ko.unwrap(valueAccessor()),
        primarySwellHeight = [],
        timeIntervals = [],
        windData = [
          { type:'direction', values: [] },
          { type:'speed', values: [] }
        ];
        /** Extract lists of surf data */
        _.each(data, function(d){
          if(d){
            primarySwellHeight.push(d.swell.components.primary.height);
            timeIntervals.push(moment(d.timestamp * 1000).format('ha'));
            windData[0].values.push(d.wind.direction);
            windData[1].values.push(d.wind.speed);
          }
        });
        // console.log(windData);
        var numItems = primarySwellHeight.length,
        barWidth = width / numItems,
        space = 0.1 * barWidth,
        allWaveHeights = bindingContext.$parent.forecastRange;

        /** Create d3 charts */
        var charts = d3.select(element);

        charts.append('div').attr('class', 'datum')
          .selectAll('div')
            .data(timeIntervals)
            .enter()
            .append('div')
            .attr('class', 'time')
            .text(function(d){ return d; });

        var swellChart = charts.append('svg')
            .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' +
            (height + margin.top + margin.bottom))
            .attr('fill', 'white')
          .append('g')
            .attr('transform', 'translate('+ margin.left +',' + margin.top + ')');

        var y = d3.scale.linear()
            .domain([0, d3.max(allWaveHeights)])
            .range([height, 0]);

        var bars = swellChart.selectAll('.bar')
          .data(primarySwellHeight)
          .enter().append('g')
          .attr('transform', function(d, i ){
            return 'translate(' + i * barWidth + ',0)';
          });

        var barLines = bars.append('rect')
          .attr('height', function(d){
            if(d){
              return height - y(d);
            }
          })
          .attr('width', barWidth - space)
          .attr('y', function(d, i){
            if(d) {
              return y(d);
            }
          })
          .attr('class', 'bar');

        bars.append('text')
          .attr('transform', 'translate(' + barWidth/2 + ', ' + (height - space) + ')')
          .html(function(d){ return d; });

        charts.append('div')
            .append('p')
            .text('Swell Height (ft.)');
        /* Wind Data */
        var wind = charts.append('div').attr('class', 'wind');

        var windDatasets = wind.append('div').selectAll('div')
                  .data(windData)
                .enter()
                  .append('div')
                  .attr('class', 'datum')
                  .attr('id', function(d){ return d.type; });

        windDatasets.filter('#direction')
                  .selectAll('div')
                  .data( function(d){
                    return d.values; })
                 .enter()
                  .append('div')
                 .datum(function(d){ return d; })
                  .style('transform', function(d){
                              return 'scale(.6) rotate(' + d + 'deg)';
                            }
                          )
                  .html('<svg viewBox="0 0 86.6 75">' +
                              '<g>' +
                                '<polygon fill="#fff" points="43.5,54.8 0,75 43.3,0 86.6,75" />' +
                              '</g></svg>');

        windDatasets.filter('#speed')
            .selectAll('div')
                      .data( function(d){ return d.values; })
                     .enter()
                      .append('div')
                      .text(function(d){ return d; });

        wind.append('p').text('Wind Speed and Direction')
                  .append('div');
  }

};
