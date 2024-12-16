import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './App.css';

const App = () => {
  const ref = useRef();

  useEffect(() => {
    const educationDataUrl = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
    const countyDataUrl = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

    Promise.all([d3.json(educationDataUrl), d3.json(countyDataUrl)])
      .then(([educationData, countyData]) => {
        const education = educationData;
        const counties = topojson.feature(countyData, countyData.objects.counties).features;

        const svg = d3.select(ref.current)
          .attr('width', 1000)
          .attr('height', 600);

        const path = d3.geoPath();

        const colorScale = d3.scaleQuantize([d3.min(education, d => d.bachelorsOrHigher), d3.max(education, d => d.bachelorsOrHigher)], d3.schemeBlues[5]);

        svg.append('g')
          .selectAll('path')
          .data(counties)
          .enter().append('path')
          .attr('class', 'county')
          .attr('data-fips', d => d.id)
          .attr('data-education', d => {
            const result = education.find(ed => ed.fips === d.id);
            return result ? result.bachelorsOrHigher : 0;
          })
          .attr('fill', d => {
            const result = education.find(ed => ed.fips === d.id);
            return result ? colorScale(result.bachelorsOrHigher) : '#ccc';
          })
          .attr('d', path)
          .on('mouseover', (event, d) => {
            const result = education.find(ed => ed.fips === d.id);
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`${result.area_name}, ${result.state}<br/>${result.bachelorsOrHigher}%`)
              .attr('data-education', result.bachelorsOrHigher)
              .style('left', `${event.pageX + 5}px`)
              .style('top', `${event.pageY - 28}px`);
          })
          .on('mouseout', () => {
            tooltip.transition().duration(500).style('opacity', 0);
          });

        const tooltip = d3.select('body').append('div')
          .attr('id', 'tooltip')
          .style('opacity', 0);

        const legend = svg.append('g')
          .attr('id', 'legend');

        const legendWidth = 300;
        const legendHeight = 20;

        const x = d3.scaleLinear()
          .domain(d3.extent(education, d => d.bachelorsOrHigher))
          .range([0, legendWidth]);

        const xAxis = d3.axisBottom(x)
          .tickSize(legendHeight)
          .tickValues(colorScale.range().map(d => colorScale.invertExtent(d)[0]))
          .tickFormat(d3.format('.1f'));

        legend.selectAll('rect')
          .data(colorScale.range().map(d => colorScale.invertExtent(d)))
          .enter().append('rect')
          .attr('height', legendHeight)
          .attr('x', d => x(d[0]))
          .attr('width', d => x(d[1]) - x(d[0]))
          .attr('fill', d => colorScale(d[0]));

        legend.call(xAxis);

      }).catch(error => {
        console.error('Error fetching data:', error);
      });

  }, []);

  return (
    <div>
      <h1 id="title">US Education Choropleth Map</h1>
      <p id="description">Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)</p>
      <svg ref={ref}></svg>
    </div>
  );
}

export default App;
