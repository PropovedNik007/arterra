import { describe, expect, it } from 'vitest';
import { planTrace, pointAlong, sampleTrace } from './trace.js';

const square = [
	{ x: 0, y: 0 },
	{ x: 10, y: 0 },
	{ x: 10, y: 10 },
	{ x: 0, y: 10 }
];
const far = square.map((p) => ({ x: p.x + 100, y: p.y }));

describe('planTrace', () => {
	it('alternates travel and print moves and closes every loop', () => {
		const plan = planTrace([square, far], { from: { x: -30, y: 0 }, duration: 3 });
		expect(plan.moves.map((move) => move.island)).toEqual([-1, 0, -1, 1]);
		expect(plan.moves[1].length).toBeCloseTo(40, 9);
		expect(plan.moves[1].points.at(-1)).toEqual(square[0]);
		expect(plan.moves[2].length).toBeCloseTo(100, 9);
		expect(plan.duration).toBe(3);
		const last = plan.moves.at(-1);
		expect((last?.start ?? 0) + (last?.duration ?? 0)).toBeCloseTo(3, 9);
	});

	it('travels faster than it prints', () => {
		const plan = planTrace([square, far], { duration: 1, rapid: 2.5 });
		const [print, travel] = plan.moves;
		const printSpeed = print.length / print.duration;
		const travelSpeed = travel.length / travel.duration;
		expect(travelSpeed / printSpeed).toBeCloseTo(2.5, 9);
	});

	it('handles an empty plan', () => {
		expect(planTrace([]).duration).toBe(0);
		expect(sampleTrace(planTrace([]), 1).index).toBe(-1);
	});
});

describe('sampleTrace', () => {
	const plan = planTrace([square, far], { duration: 2 });

	it('starts at the first seam and ends back at the last seam', () => {
		expect(sampleTrace(plan, 0).point).toEqual(square[0]);
		const end = sampleTrace(plan, 5);
		expect(end.index).toBe(plan.moves.length - 1);
		expect(end.fraction).toBe(1);
		expect(end.point).toEqual(far[0]);
	});

	it('moves at constant speed along a print move', () => {
		const [first] = plan.moves;
		const quarter = sampleTrace(plan, first.duration / 4);
		expect(quarter.index).toBe(0);
		expect(quarter.point.x).toBeCloseTo(10, 6);
		expect(quarter.point.y).toBeCloseTo(0, 6);
		const half = sampleTrace(plan, first.duration / 2);
		expect(half.point.x).toBeCloseTo(10, 6);
		expect(half.point.y).toBeCloseTo(10, 6);
	});

	it('finds the same move from any hint', () => {
		const time = plan.moves[2].start + 0.001;
		for (const hint of [0, 1, 2, 3, 99, -5]) expect(sampleTrace(plan, time, hint).index).toBe(2);
	});
});

describe('pointAlong', () => {
	it('clamps to the ends', () => {
		const [move] = planTrace([square]).moves;
		expect(pointAlong(move, -1)).toEqual(square[0]);
		expect(pointAlong(move, 1e9)).toEqual(square[0]);
		expect(pointAlong(move, 15)).toEqual({ x: 10, y: 5 });
	});
});
