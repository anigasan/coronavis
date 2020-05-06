import { Injectable } from "@angular/core";
import { MatDialog } from '@angular/material/dialog';
import { MultiPolygon } from 'geojson';
import { LocalStorageService } from 'ngx-webstorage';
import { BehaviorSubject, Observable } from "rxjs";
import { map, tap } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedBackgroundOptions } from '../map/options/bed-background-options';
import { BedType } from '../map/options/bed-type.enum';
import { BedStatusChoropleth } from "../map/overlays/bedstatuschoropleth";
import { LabelCanvasLayer } from '../map/overlays/label-canvas.layer';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { QualitativeColormapService } from './qualitative-colormap.service';
import { TooltipService } from "./tooltip.service";

@Injectable({
  providedIn: "root"
})
export class BedChoroplethLayerService {

  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private qualitativeDiviDevelopmentRepository: QualitativeDiviDevelopmentRepository,
    private qualitativeColorMapService: QualitativeColormapService, 
    private tooltipService: TooltipService,
    private matDialog: MatDialog,
    private storage: LocalStorageService,
    ) {
  }

  public getQualitativeLayer(options$: BehaviorSubject<BedBackgroundOptions>): Observable<[BedStatusChoropleth<QualitativeTimedStatus>, LabelCanvasLayer<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>]> {
    const option = options$.value;
    this.loading$.next(true);
    return this.qualitativeDiviDevelopmentRepository.getDiviDevelopmentForAggLevel(option.aggregationLevel, new Date(), -1)
    .pipe(
      map(data => {
        return [
          new BedStatusChoropleth(
            this.getName(option.aggregationLevel, option.bedType), 
            data, 
            option,
            this.qualitativeColorMapService, 
            this.tooltipService,
            this.matDialog
          ),
          new LabelCanvasLayer(
            this.getName(option.aggregationLevel, option.bedType) + '_labels',
            data,
            option.aggregationLevel,
            options$,
            this.storage
          )
      ] as [BedStatusChoropleth<QualitativeTimedStatus>, LabelCanvasLayer<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>];
      }),
      tap(() => this.loading$.next(false))
    );
  }

  // public getQuantitativeLayer(option: BedBackgroundOptions): Observable<BedStatusChoropleth<QuantitativeTimedStatus>> {
  //   this.loading$.next(true);
  //   return this.quantitativeDiviDevelopmentRepository.getDiviDevelopmentForAggLevel(option.aggregationLevel)
  //   .pipe(
  //     map(data => {
  //       return new BedStatusChoropleth(
  //         this.getName(option.aggregationLevel, option.bedType), 
  //         data, 
  //         option.aggregationLevel, 
  //         option.bedType, 
  //         this.quantitativeColorMapService, 
  //         this.tooltipService
  //       );
  //     }),
  //     tap(() => this.loading$.next(false))
  //   );
  // }

  public getName(granularity: AggregationLevel, type: BedType) {
    return `Hospitals_${granularity}_${type}`;
  }
}
