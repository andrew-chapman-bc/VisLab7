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
    makeProjection()
})




function makeForce() 
{
    const outerWidth = 800;
    const outerHeight = 500;

    const margin = {top:40, left:40, bottom:25, right:25};
    const width = outerWidth - margin.left - margin.right;
    const height = outerHeight - margin.top - margin.bottom;


    const svg = d3.select('body')
                .append('svg')
                .attr('width', outerWidth)
                .attr('height', outerHeight)
                .attr("viewBox", [0, 0, width, height])
                .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
                //.append('g')
                //.attr('transform', `translate(${margin.left}, ${margin.top})`);

    let maxPass = d3.max(airport.nodes, d=> d.passengers)

    const circleScale = d3.scaleLinear()
                .domain([0,maxPass])
                .range([5, 25]);   

    const force = d3.forceSimulation(airport.nodes)
                    .force("link", d3.forceLink(airport.links))
                    .force("charge", d3.forceManyBody())
                    .force("center", d3.forceCenter().x(outerWidth/2).y(outerHeight/2))
                    .on("tick", ticked);;

    //Create edges as lines
    var edges = svg.append("g")
                    .style("stroke", "#ccc")
                    .style("stroke-width", 1)
                    .selectAll("line")
                    .data(airport.links)
                    .join("line");

    //Create nodes as circles
    var nodes = svg.selectAll("circle")
                    .data(airport.nodes)
                    .join("circle")
                        .attr("r", d=>circleScale(d.passengers))
                        .attr("fill", "gray")
                        .attr("stroke", "black")

    nodes.append("title")
            .text(function(d) {
                return d.name;
            });

    function ticked() 
    {
        edges
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
            
        nodes
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }

    const drag = d3
    .drag()
    .on("start", event => {
        force.alphaTarget(0.3).restart();
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    })
    .on("drag", event => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    })
    .on("end", event => {
        force.alphaTarget(0.0);
        event.subject.fx = null;
        event.subject.fy = null;
        
    });

    nodes.call(drag);
            
    
}

function makeProjection() {

    const outerWidth = 800;
    const outerHeight = 500;

    const margin = {top:40, left:40, bottom:25, right:25};
    const width = outerWidth - margin.left - margin.right;
    const height = outerHeight - margin.top - margin.bottom;


    const svg = d3.select('body')
                .append('svg')
                .attr('width', outerWidth)
                .attr('height', outerHeight)
                .attr("viewBox", [0, 0, width, height])
                //.attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    
    console.log('in the function', worldmap);
    const features = topojson.feature(worldmap, worldmap.objects.countries).features;
    const projection = d3
                        .geoMercator()
                        .fitExtent(
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
    .attr("stroke-linejoin", "round")
    
    svg.append("path")
	.datum(topojson.mesh(worldmap, worldmap.objects.countries))
	.attr("d", path)
	.attr('fill', 'none')
  	.attr('stroke', 'white')
	.attr("class", "subunit-boundary");

}

