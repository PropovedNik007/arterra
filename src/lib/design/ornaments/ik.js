/**
 * Planar inverse kinematics for a three-joint arm (shoulder, elbow, wrist)
 * that carries a straight tool, e.g. a print nozzle. The tool keeps a fixed
 * absolute angle, so the wrist point is the tool tip moved back along the tool;
 * the shoulder and elbow then solve the classic two-link problem analytically
 * (law of cosines), and the wrist joint takes up whatever rotation is left.
 *
 * Angles are radians in SVG user space (y points down, so a positive angle
 * turns clockwise on screen). Pure and deterministic, safe for SSR and tests.
 */

/** @typedef {{ x: number, y: number }} Point */

/**
 * @typedef {object} ArmPose
 * @property {number} shoulder absolute angle of the upper arm
 * @property {number} elbow elbow angle relative to the upper arm
 * @property {number} wrist wrist angle relative to the forearm
 * @property {Point} elbowPoint
 * @property {Point} wristPoint
 * @property {Point} tip where the tool actually ends (the target when reachable)
 * @property {boolean} reached
 */

/**
 * @param {object} arm
 * @param {Point} arm.base shoulder joint position
 * @param {number} arm.upper upper-arm length (shoulder to elbow)
 * @param {number} arm.fore forearm length (elbow to wrist)
 * @param {number} arm.tool tool length (wrist to tip)
 * @param {number} [arm.toolAngle] absolute tool angle; π/2 points straight down
 * @param {1 | -1} [arm.bend] which side the elbow sits on; 1 keeps it above a rightward reach (y down)
 * @param {number} [arm.minReach] closest the wrist may come to the shoulder, as a fraction of full reach
 * @param {Point} target desired tool tip
 * @returns {ArmPose}
 */
export function solveArm(
	{ base, upper, fore, tool, toolAngle = Math.PI / 2, bend = 1, minReach = 0.2 },
	target
) {
	const wx = target.x - Math.cos(toolAngle) * tool;
	const wy = target.y - Math.sin(toolAngle) * tool;
	let dx = wx - base.x;
	let dy = wy - base.y;
	let distance = Math.hypot(dx, dy);
	const longest = upper + fore;
	const shortest = Math.max(Math.abs(upper - fore), longest * minReach);
	const reach = Math.min(longest, Math.max(shortest, distance));
	if (distance < 1e-9) {
		// Degenerate: no direction to the wrist; reach straight out along +x.
		dx = 1;
		dy = 0;
		distance = 1;
	}
	const direction = Math.atan2(dy, dx);
	const cosine = (reach * reach - upper * upper - fore * fore) / (2 * upper * fore);
	const elbow = bend * Math.acos(Math.min(1, Math.max(-1, cosine)));
	const shoulder = direction - Math.atan2(fore * Math.sin(elbow), upper + fore * Math.cos(elbow));
	const wrist = toolAngle - shoulder - elbow;
	const pose = forwardArm({ base, upper, fore, tool }, shoulder, elbow, wrist);
	return {
		...pose,
		shoulder,
		elbow,
		wrist,
		reached: Math.abs(reach - distance) < 1e-6
	};
}

/**
 * Joint positions for given joint angles.
 * @param {{ base: Point, upper: number, fore: number, tool: number }} arm
 * @param {number} shoulder absolute
 * @param {number} elbow relative
 * @param {number} wrist relative
 * @returns {{ elbowPoint: Point, wristPoint: Point, tip: Point }}
 */
export function forwardArm({ base, upper, fore, tool }, shoulder, elbow, wrist) {
	const a1 = shoulder;
	const a2 = a1 + elbow;
	const a3 = a2 + wrist;
	const elbowPoint = { x: base.x + Math.cos(a1) * upper, y: base.y + Math.sin(a1) * upper };
	const wristPoint = {
		x: elbowPoint.x + Math.cos(a2) * fore,
		y: elbowPoint.y + Math.sin(a2) * fore
	};
	const tip = { x: wristPoint.x + Math.cos(a3) * tool, y: wristPoint.y + Math.sin(a3) * tool };
	return { elbowPoint, wristPoint, tip };
}

/**
 * Frame-rate independent exponential smoothing factor: how far to move toward
 * a target this frame, for a time constant `tau` (seconds).
 * @param {number} dt seconds since the last frame
 * @param {number} tau
 */
export function smoothing(dt, tau) {
	if (tau <= 0) return 1;
	return 1 - Math.exp(-Math.max(0, dt) / tau);
}
