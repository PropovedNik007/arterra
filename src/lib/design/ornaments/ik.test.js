import { describe, expect, it } from 'vitest';
import { forwardArm, smoothing, solveArm } from './ik.js';

const arm = { base: { x: 0, y: 0 }, upper: 300, fore: 260, tool: 60 };

/** Signed side of point p relative to the line a→b (y down: negative is above a rightward line). */
const side = (
	/** @type {{x:number,y:number}} */ a,
	/** @type {{x:number,y:number}} */ b,
	/** @type {{x:number,y:number}} */ p
) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);

describe('solveArm', () => {
	it('puts the tool tip on a reachable target, with the tool at its fixed angle', () => {
		for (const target of [
			{ x: 400, y: 100 },
			{ x: 200, y: 250 },
			{ x: -150, y: 300 },
			{ x: 350, y: -200 }
		]) {
			const pose = solveArm(arm, target);
			expect(pose.reached).toBe(true);
			expect(pose.tip.x).toBeCloseTo(target.x, 6);
			expect(pose.tip.y).toBeCloseTo(target.y, 6);
			expect(pose.shoulder + pose.elbow + pose.wrist).toBeCloseTo(Math.PI / 2, 9);
			const fk = forwardArm(arm, pose.shoulder, pose.elbow, pose.wrist);
			expect(fk.tip.x).toBeCloseTo(target.x, 6);
			expect(fk.tip.y).toBeCloseTo(target.y, 6);
		}
	});

	it('keeps the link lengths', () => {
		const pose = solveArm(arm, { x: 320, y: 140 });
		expect(Math.hypot(pose.elbowPoint.x, pose.elbowPoint.y)).toBeCloseTo(300, 6);
		expect(
			Math.hypot(pose.wristPoint.x - pose.elbowPoint.x, pose.wristPoint.y - pose.elbowPoint.y)
		).toBeCloseTo(260, 6);
		expect(Math.hypot(pose.tip.x - pose.wristPoint.x, pose.tip.y - pose.wristPoint.y)).toBeCloseTo(
			60,
			6
		);
	});

	it('bends the elbow above a rightward reach by default, and below with bend -1', () => {
		const target = { x: 380, y: 160 };
		const up = solveArm(arm, target);
		expect(side(arm.base, up.wristPoint, up.elbowPoint)).toBeLessThan(0);
		const down = solveArm({ ...arm, bend: -1 }, target);
		expect(side(arm.base, down.wristPoint, down.elbowPoint)).toBeGreaterThan(0);
	});

	it('stretches toward unreachable targets instead of failing', () => {
		const pose = solveArm(arm, { x: 5000, y: 60 });
		expect(pose.reached).toBe(false);
		expect(Math.hypot(pose.wristPoint.x, pose.wristPoint.y)).toBeCloseTo(560, 6);
		expect(pose.wristPoint.y).toBeCloseTo(0, 6);
		for (const value of [pose.shoulder, pose.elbow, pose.wrist, pose.tip.x, pose.tip.y]) {
			expect(Number.isFinite(value)).toBe(true);
		}
	});

	it('stays finite when the wrist target sits on the shoulder', () => {
		const pose = solveArm(arm, { x: 0, y: 60 });
		expect(pose.reached).toBe(false);
		for (const value of [pose.shoulder, pose.elbow, pose.wrist, pose.tip.x, pose.tip.y]) {
			expect(Number.isFinite(value)).toBe(true);
		}
		expect(Math.hypot(pose.wristPoint.x, pose.wristPoint.y)).toBeCloseTo(560 * 0.2, 6);
	});

	it('honours other tool angles', () => {
		const pose = solveArm({ ...arm, toolAngle: 0 }, { x: 300, y: 200 });
		expect(pose.tip.x).toBeCloseTo(300, 6);
		expect(pose.wristPoint.x).toBeCloseTo(240, 6);
		expect(pose.wristPoint.y).toBeCloseTo(200, 6);
	});
});

describe('smoothing', () => {
	it('is frame-rate independent', () => {
		const once = smoothing(0.032, 0.1);
		const twice = 1 - (1 - smoothing(0.016, 0.1)) ** 2;
		expect(once).toBeCloseTo(twice, 12);
	});

	it('is bounded', () => {
		expect(smoothing(0, 0.1)).toBe(0);
		expect(smoothing(10, 0.1)).toBeCloseTo(1, 6);
		expect(smoothing(0.016, 0)).toBe(1);
		expect(smoothing(-1, 0.1)).toBe(0);
	});
});
