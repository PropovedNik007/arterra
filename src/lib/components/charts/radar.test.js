import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import SkillsRadar from './SkillsRadar.svelte';
import { cv } from '../../content/cv.js';
import {
	RADAR_RADIUS,
	axisAngle,
	labelAnchor,
	labelLines,
	polygonPoints,
	radarLayout,
	valuePoint,
	wedgePath
} from './radar.js';

describe('skills radar data', () => {
	it('keeps the self-assessment exactly as given', () => {
		expect(cv.radar.axes).toEqual([
			'Data Science',
			'Computer Vision',
			'NLP',
			'Blockchain',
			'IoT',
			'3D/AR',
			'Front-End',
			'Back-End',
			'DevOps',
			'Databases'
		]);
		expect(cv.radar.max).toBe(100);
		expect(cv.radar.series).toEqual([
			{ id: 'experience', label: 'Experience', values: [90, 80, 75, 30, 50, 60, 70, 80, 50, 70] },
			{ id: 'interest', label: 'Interest', values: [80, 100, 100, 60, 60, 90, 80, 90, 60, 70] }
		]);
	});

	it('has one in-range score per axis for every series', () => {
		for (const series of cv.radar.series) {
			expect(series.values).toHaveLength(cv.radar.axes.length);
			for (const value of series.values) {
				expect(value).toBeGreaterThanOrEqual(0);
				expect(value).toBeLessThanOrEqual(cv.radar.max);
			}
		}
	});
});

describe('radar geometry', () => {
	it('starts at the top and runs clockwise', () => {
		expect(axisAngle(0, 4)).toBeCloseTo(-Math.PI / 2);
		expect(valuePoint(0, 4, 100)).toEqual({ x: 0, y: -RADAR_RADIUS });
		expect(valuePoint(1, 4, 50)).toEqual({ x: RADAR_RADIUS / 2, y: 0 });
		expect(valuePoint(2, 4, 100)).toEqual({ x: 0, y: RADAR_RADIUS });
	});

	it('clamps scores and builds a closed polygon string', () => {
		expect(valuePoint(0, 4, 150)).toEqual({ x: 0, y: -RADAR_RADIUS });
		expect(valuePoint(0, 4, -5)).toEqual({ x: 0, y: 0 });
		expect(polygonPoints([100, 100, 100, 100])).toBe('0,-100 100,0 0,100 -100,0');
	});

	it('anchors labels by side and wraps only long side labels', () => {
		expect(labelAnchor(axisAngle(0, 10))).toBe('middle');
		expect(labelAnchor(axisAngle(1, 10))).toBe('start');
		expect(labelAnchor(axisAngle(5, 10))).toBe('middle');
		expect(labelAnchor(axisAngle(8, 10))).toBe('end');
		expect(labelLines('Computer Vision', 'start')).toEqual(['Computer', 'Vision']);
		expect(labelLines('Data Science', 'middle')).toEqual(['Data Science']);
		expect(labelLines('Blockchain', 'start')).toEqual(['Blockchain']);
	});

	it('keeps every estimated label box inside the viewBox and off the rings', () => {
		const { labels, viewBox } = radarLayout(cv.radar.axes);
		for (const { text, box } of labels) {
			expect(box.x0, text).toBeGreaterThanOrEqual(viewBox.x);
			expect(box.x1, text).toBeLessThanOrEqual(viewBox.x + viewBox.width);
			expect(box.y0, text).toBeGreaterThanOrEqual(viewBox.y);
			expect(box.y1, text).toBeLessThanOrEqual(viewBox.y + viewBox.height);
			// The box's closest point to the centre stays outside the outer ring.
			const nx = Math.min(Math.max(0, box.x0), box.x1);
			const ny = Math.min(Math.max(0, box.y0), box.y1);
			expect(Math.hypot(nx, ny), text).toBeGreaterThan(RADAR_RADIUS);
		}
	});

	it('renders legible labels at a 375px phone width', () => {
		const { viewBox } = radarLayout(cv.radar.axes);
		// 375px viewport − 1.25rem shell gutter − card padding and border.
		const chartWidth = 375 - 20 - 2 * 12 - 2;
		const scale = chartWidth / viewBox.width;
		expect(15 * scale).toBeGreaterThanOrEqual(11.5);
		// The radar itself keeps a usable diameter.
		expect(2 * RADAR_RADIUS * scale).toBeGreaterThanOrEqual(150);
	});

	it('draws a wedge arc around each axis', () => {
		expect(wedgePath(0, 4, 100)).toBe('M0 0L-70.71 -70.71A100 100 0 0 1 70.71 -70.71Z');
	});
});

describe('SkillsRadar server render', () => {
	it('prerenders the SVG chart, legend toggles and table fallback', () => {
		const { body } = render(SkillsRadar, { props: { radar: cv.radar } });
		expect(body).toContain('<svg');
		expect(body.match(/<polygon/g)).toHaveLength(2);
		expect(body.match(/aria-pressed="true"/g)).toHaveLength(2);
		expect(body).toContain('Self-assessed, 0–100');
		expect(body).toContain('Show as table');
		expect(body.match(/<th[^>]*scope="row"/g)).toHaveLength(10);
	});
});
