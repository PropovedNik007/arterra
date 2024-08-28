<script>
	import { base } from '$app/paths';

	// import { MDBRow, MDBCol } from 'mdbsvelte';
	import { Radar } from 'svelte-chartjs';
	import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

	// Register the required components
	Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
	Chart.defaults.backgroundColor = '#0000';
	Chart.defaults.borderColor = '#36A2EB';
	Chart.defaults.color = '#ffffff';

	// import Radar from "svelte-chartjs/src/Radar.svelte"

	let dataRadar = {
		labels: ['Data Science', 'Computer Vision', 'NLP', 'Blockchain', 'IoT', '3D/AR', 'Front-End', 'Back-End', 'DevOps', 'Databases'],
		datasets: [
			{
				label: 'Expirience',
				// backgroundColor: 'rgba(0, 150, 136, 0.5)',
				backgroundColor: 'rgba(71, 225, 167, 0.5)',
				borderColor: 'rgb(0, 150, 136)',
				hoverBackgroundColor: 'rgba(0, 150, 136, 0.75)',
				// pointBackgroundColor: '#ffffff',
				data: [90, 80, 75, 30, 50, 60, 70, 80, 50, 70]
			},
			{
				label: 'Interest',
				// backgroundColor: 'rgba(71, 225, 167, 0.5)',
				backgroundColor: 'rgba(0, 150, 136, 0.5)',
				// borderColor: 'rgb(71, 225, 167)',
				borderColor: 'rgb(0, 150, 136)',
				data: [80, 100, 100, 60, 60, 90, 80, 90, 60, 70]
			}
		]
	};
</script>


<Radar
	data={dataRadar} 
	options={{ 
		responsive: true,
		scales: {
			r: {
				ticks: {
					color: '#607D8B',
					font: {
						size: 16
					},
					backdropColor: 'rgba(0, 0, 0, 0.1)'
				},
				grid: {
					color: '#546E7A'
				}
			}
		}}}
/>