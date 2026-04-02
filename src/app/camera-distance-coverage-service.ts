import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

type Range = {
  min: number;
  max: number;
};

type Camera = {
  distance: Range;
  light: Range;
};


@Injectable({
  providedIn: 'root',
})
export class CameraDistanceCoverageService {
 
  private cameras$ = new BehaviorSubject<Camera[]>([]);
  private requiredDistance$ = new BehaviorSubject<Range>({ min: 0, max: 0 });
  private requiredLight$ = new BehaviorSubject<Range>({ min: 0, max: 0 });

  
  coverage$ = combineLatest([
    this.cameras$,
    this.requiredDistance$,
    this.requiredLight$
  ]).pipe(
    map(([cameras, distance, light]) =>
      this.canCover(distance, light, cameras)
    )
  );

  setCameras(cameras: Camera[]) {
    this.cameras$.next(cameras);
  }

  addCamera(camera: Camera) {
    const current = this.cameras$.value;
    this.cameras$.next([...current, camera]);
  }

  setRequirements(distance: Range, light: Range) {
    this.requiredDistance$.next(distance);
    this.requiredLight$.next(light);
  }

  private isFullyCovered(intervals: Range[], target: Range): boolean {
    if (intervals.length === 0) return false;

    intervals.sort((a, b) => a.min - b.min);

    let currentEnd = target.min;

    for (const interval of intervals) {
      if (interval.max < currentEnd) continue;

      if (interval.min > currentEnd) return false;

      currentEnd = Math.max(currentEnd, interval.max);

      if (currentEnd >= target.max) return true;
    }

    return false;
  }

  private canCover(
    requiredDistance: Range,
    requiredLight: Range,
    cameras: Camera[]
  ): boolean {

    const events: {
      pos: number;
      type: 'start' | 'end';
      camera: Camera | null;
    }[] = [];

    for (const cam of cameras) {
      if (
        cam.distance.max <= requiredDistance.min ||
        cam.distance.min >= requiredDistance.max
      ) continue;

      events.push({ pos: cam.distance.min, type: 'start', camera: cam });
      events.push({ pos: cam.distance.max, type: 'end', camera: cam });
    }

    events.push({ pos: requiredDistance.min, type: 'start', camera: null });
    events.push({ pos: requiredDistance.max, type: 'end', camera: null });

    events.sort((a, b) => {
      if (a.pos !== b.pos) return a.pos - b.pos;
      return a.type === 'start' ? -1 : 1;
    });

    const active = new Set<Camera>();

    for (let i = 0; i < events.length - 1; i++) {
      const e = events[i];

      if (e.camera) {
        if (e.type === 'start') active.add(e.camera);
        else active.delete(e.camera);
      }

      const nextPos = events[i + 1].pos;

      if (
        nextPos <= requiredDistance.min ||
        e.pos >= requiredDistance.max
      ) continue;

      const segStart = Math.max(e.pos, requiredDistance.min);
      const segEnd = Math.min(nextPos, requiredDistance.max);

      if (segStart >= segEnd) continue;

      const intervals: Range[] = [];

      active.forEach(cam => {
        if (
          cam.distance.min <= segStart &&
          cam.distance.max >= segEnd
        ) {
          intervals.push(cam.light);
        }
      });

      if (!this.isFullyCovered(intervals, requiredLight)) {
        return false;
      }
    }

    return true;
  } 
}
