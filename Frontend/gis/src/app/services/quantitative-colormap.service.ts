import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import { QuantitativeBedStatusSummary } from './types/bed-status-summary';
import { QuantitativeTimedStatus } from '../repositories/types/out/quantitative-timed-status';
import { BedType } from '../map/options/bed-type.enum';

@Injectable({
  providedIn: 'root'
})
export class QuantitativeColormapService {
  constructor() {
  }

  public static CChoroplethColorMap = d3.scaleQuantize<string>()
    .domain([-1, 1])
    .range([...d3.schemeGreens[8].slice(0, 7).reverse(), '#fff', ...d3.schemeBlues[8].slice(0, 7)]);

  public static bedStatusColors = ['rgb(113,167,133)', 'rgb(230,181,72)', 'rgb(198,106,75)'];
  public static bedStati = ['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar', 'Keine Information'];

  public static bedStatusThresholdsColors = ['#c2cbd4', 'rgb(198,106,75)', 'rgb(230,181,72)', 'rgb(113,167,133)' ];
  public static bedStatusThresholds = [0, 5, 10];

  public static BedStatusColor = d3.scaleLinear<string, string>()
      .domain([0, 0.5, 1])
      .range(QuantitativeColormapService.bedStatusColors)
      .interpolate(d3.interpolateRgb.gamma(2.2));


  private singleHospitalCM = d3.scaleOrdinal<string, string>()
    .domain(QuantitativeColormapService.bedStati)
    .range([...QuantitativeColormapService.bedStatusColors, '#c2cbd4', '#bbb']);

  private singleHospitalCMStates = d3.scaleThreshold<number, string>()
    .domain(QuantitativeColormapService.bedStatusThresholds)
    .range(QuantitativeColormapService.bedStatusThresholdsColors);

  private caseChoroplethColorMap = d3.scaleQuantize<string>()
    .domain([-1, 1])
    .range([...d3.schemeGreens[8].slice(0, 7).reverse(), '#fff', ...d3.schemeBlues[8].slice(0, 7)]);

  private continousColorMap = d3.scaleLinear<string, string>()
    .domain([0, 0.5, 1])
    .range(QuantitativeColormapService.bedStatusColors)
    .interpolate(d3.interpolateRgb.gamma(2.2));
  getSingleHospitalColormap(): d3.ScaleOrdinal<string, string> {
    return this.singleHospitalCM;
  }
  getSingleHospitalColormapStates(): d3.ScaleThreshold<number, string> {
    return this.singleHospitalCMStates;
  }
  getChoroplethCaseColor(normalizedDiff: number): string {
    return this.caseChoroplethColorMap(normalizedDiff);
  }

  public propertyAccessor(type: BedType) {
    switch (type) {
      case BedType.ecmo:
        return (a: QuantitativeTimedStatus) => a.ecmo_state;
      case BedType.icuHigh:
        return (a: QuantitativeTimedStatus) => a.icu_high_care;
      case BedType.icuLow:
        return (a: QuantitativeTimedStatus) => a.icu_low_care;
    }
  }

  getLatestBedStatusColor(t: Array<QuantitativeTimedStatus>, type: BedType) {
    const latest = t[t.length -1];
    const bedStatus =this.propertyAccessor(type)(latest);
    return this.getBedStatusColor(bedStatus);
  }

  /**
   * Calculates the ratio of available / occupied
   * @param bedStatus
   */
  getBedStatusColor(bedStatus: QuantitativeBedStatusSummary) {
    if (bedStatus === null) {
      return this.singleHospitalCM('Keine Information');
    }

    if (0 === bedStatus.full + bedStatus.free) {
      return this.singleHospitalCM('Nicht verfügbar');
    }

    const score = 1 - bedStatus.free / (bedStatus.full + bedStatus.free);
    const normalizeValues = d3.scaleQuantize()
      .domain([0, 1])
      .range([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);

    return this.continousColorMap(normalizeValues(score));
  }
}