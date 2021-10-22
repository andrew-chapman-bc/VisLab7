let airport;
let worldmap;

Promise.all([ // load multiple files
	d3.json('airports.json'),
	d3.json('world-110m.json')
]).then(data=>{ // or use destructuring :([airports, wordmap])=>{ ... 
	airport = data[0]; // data1.csv
	worldmap = data[1]; // data2.json
    console.log('airport', airport);
    console.log('worldmap', worldmap);
    console.log('worldmap countries', worldmap.objects.countries);
    makeForce()
    //makeProjection()
})

const outerWidth = 800;
    const outerHeight = 500;

    const margin = {top:40, left:40, bottom:25, right:25};
    const width = outerWidth - margin.left - margin.right;
    const height = outerHeight - margin.top - margin.bottom;


    const svg = d3.select('body')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr("viewBox", [0, 0, outerWidth, outerHeight])
    let projection = d3.geoMercator()
function drawMap() {
    const features = topojson.feature(worldmap, worldmap.objects.countries).features;
     
    projection.fitExtent(
                          [[0, 0], [width, height]], // available screen space
                          topojson.feature(worldmap, worldmap.objects.countries) // geoJSON object
                        );

    const path = d3.geoPath().projection(projection);

    svg
    .selectAll("path")
    .data(features) // geojson feature collection
    .join("path")
    .attr("d", d=>path(d))
    .attr("fill", "black")
    .attr("stroke", "white")
    //.attr("stroke-linejoin", "round")
    .attr("class", "mapdrawing");
    
    svg.append("path")
	.datum(topojson.mesh(worldmap, worldmap.objects.countries))
	.attr("d", path)
	.attr('fill', 'none')
  	.attr('stroke', 'white')
	.attr("class", "subunit-boundary");
}

function makeForce() 
{
    
                //.attr("style", "max-width: 100%; height: auto; height: intrinsic;");
                //.append('g')
                //.attr('transform', `translate(${margin.left}, ${margin.top})`);
    drawMap()
    svg.selectAll("path")
        .attr("opacity", 0.0)
    let maxPass = d3.max(airport.nodes, d=> d.passengers)

    const circleScale = d3.scaleLinear()
                .domain([0,maxPass])
                .range([2, 6]);   

    const force = d3.forceSimulation(airport.nodes)
                    .force("link", d3.forceLink(airport.links))
                    .force("charge", d3.forceManyBody())
                    .force("x", d3.forceX(outerWidth/2))
                    .force("y", d3.forceY(outerHeight/2))
                    .on("tick", ticked);

    //Create edges as lines
    var edges = svg.append("g")
                    .style("stroke", "orange")
                    .style("stroke-width", 1)
                    .selectAll("line")
                    .data(airport.links)
                    .join("line");

    //Create nodes as circles
    var nodes = svg.selectAll("circle")
                    .data(airport.nodes)
                    .join("circle")
                        .attr("r", d=>circleScale(d.passengers))
                        .attr("fill", "orange")
                        .attr("stroke", "black")

    nodes.append("title")
            .text(function(d) {
                return d.name;
            });

    function ticked() 
    {
        edges
        .transition().duration(75)
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
            
        nodes
        .transition().duration(75)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }

    const drag = d3.drag()
    .filter(event => visType === "force")
    .on("start", event => {
        if (!event.active) force.alphaTarget(0.3).restart();
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    })
    .on("drag", event => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    })
    .on("end", event => {
        if (!event.active) force.alphaTarget(0.0);
        event.subject.fx = null;
        event.subject.fy = null;
        
    });

    nodes.call(drag);
    let visType = d3.selectAll("input[name=type]").node().value;
    console.log(typeof(visType))
    
    d3.selectAll("input[name=type]").on("change", event=>{
        visType = event.target.value
        console.log(typeof(visType),visType)
        switchLayout();
    });

    function switchLayout() {
        if (visType === "map") {
            // stop the simulation
            force.alphaTarget(.3).stop();
            // set the positions of links and nodes based on geo-coordinates
            nodes.transition().duration(500)
                .attr("cx", d => projection([d.longitude, d.latitude])[0])
                .attr('cy', d => projection([d.longitude, d.latitude])[1]);
            edges.transition().duration(500)
                .attr('x1', d => projection([d.source.longitude, d.source.latitude])[0])
                .attr('y1', d => projection([d.source.longitude, d.source.latitude])[1])
                .attr('x2', d => projection([d.target.longitude, d.target.latitude])[0])
                .attr('y2', d => projection([d.target.longitude, d.target.latitude])[1]);
            // set the map opacity to 1
            svg.selectAll('path').transition().duration(500).attr('opacity', 1);

          } else { // force layout
              // restart the simulation
              force.alphaTarget(.3).restart()
              // set the map opacity to 0
              svg.selectAll('path').transition().duration(500).attr('opacity', 0);
          }
      }

}

