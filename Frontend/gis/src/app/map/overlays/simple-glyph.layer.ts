import * as L from 'leaflet';
import * as d3 from 'd3';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';
import { DiviHospital } from 'src/app/services/divi-hospitals.service';
import { ColormapService } from 'src/app/services/colormap.service';

export class SimpleGlyphLayer extends Overlay {

  private gHospitals: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;

  private map: L.Map;

  constructor(
    name: string,
    private data: DiviHospital[],
    private tooltipService: TooltipService,
    private colormapService: ColormapService
    ) {
    super(name, null);
    this.enableDefault = true;
  }

  createOverlay(map: L.Map) {
    this.map = map;

    this.map.on('zoom', () => {
      this.onZoomed();
    });

    const colorScale = this.colormapService.getSingleHospitalColormap();
    // calculate new color scale
    // .domain expects an array of [min, max] value
    // d3.extent returns exactly this array

    const locationPoints = this.data.map(d => this.map.latLngToContainerPoint(d.Location));
    const [xMin, xMax] = d3.extent(locationPoints, d => d.x);
    const [yMin, yMax] = d3.extent(locationPoints, d => d.y);

    const svgElement: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('viewBox', `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`);

    const self = this;
    const rectSize = 10;

    const padding = 2;
    const yOffset = 10;

    this.gHospitals = d3.select(svgElement)
      .selectAll('g.hospital')
      .data<DiviHospital>(this.data)
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'hospital')
        .attr('transform', d => {
          const p = this.map.latLngToLayerPoint(d.Location);
          // console.log(p, d.Location);
          return `translate(${p.x}, ${p.y})`; })
      .on('mouseenter', function(d1: DiviHospital) {
        const evt: MouseEvent = d3.event;
        const t = self.tooltipService.openAtElementRef(GlyphTooltipComponent, {x: evt.clientX, y: evt.clientY});
        // console.log('mouseenter', d1);
        t.diviHospital = d1;
        d3.select(this).raise();
      })
      .on('mouseleave', () => this.tooltipService.close());

    this.gHospitals
      .append('rect')
      .attr('width', '50')
      .attr('height', '22')
      .attr('fill', 'white')
      .attr('stroke', '#cccccc');

    this.gHospitals
      .append('text')
      .text(d1 => {
        // Hackity hack :)
        const splitted = d1.Adress.split(' ');
        return splitted[splitted.length - 1];
      })
      .attr('x', padding)
      .attr('y', '8')
      .attr('font-size', '8px');

    this.gHospitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .style('fill', d1 => colorScale(d1.icuLowCare))
      .attr('x', padding)
      .attr('y', yOffset);

    this.gHospitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('x', `${rectSize}px`)
      .style('fill', d1 => colorScale(d1.icuHighCare))
      .attr('y', yOffset)
      .attr('x', `${rectSize + padding * 2}px`);

    this.gHospitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('x', `${2 * rectSize}px`)
      .style('fill', d1 => colorScale(d1.ECMO))
      .attr('y', yOffset)
      .attr('x', `${2 * rectSize + padding * 3}px`);


    // gHos
    //   .append('rect')
    //   .attr('width', '30px')
    //   .attr('height', '30px')
    //   .style('fill', d => colorScale(d.icuLowCare));
    //
    const latExtent = d3.extent(this.data, i => i.Location.lat);
    const lngExtent = d3.extent(this.data, i => i.Location.lng);

    const latLngBounds = new L.LatLngBounds([latExtent[0], lngExtent[0]], [latExtent[1], lngExtent[1]]);
    this.onZoomed();

    return L.svgOverlay(svgElement, latLngBounds, {
      interactive: true,
      zIndex: 3
    });
    // return L.svgOverlay(svgElement, this.map.getBounds());
  }

  onZoomed() {
    // this.gHospitals
    //   .attr('transform', (d, i, n) => {
    //     const p = this.map.latLngToLayerPoint(d.Location);
    //     return `translate(${p.x}, ${p.y})`;
    //   });
    const zoom = this.map.getZoom();
    const scale = Math.pow(9 / (zoom), 3);

    console.log('zoomed', this.map.getZoom(), scale);

    this.gHospitals
      .selectAll('*')
      .transition()
      .duration(500)
      .attr('transform', d => {
        return `scale(${scale}, ${scale})`;
      });
  }
}
