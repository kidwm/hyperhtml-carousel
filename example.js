import Carousel from './carousel.js';
import './slider.css';

const carousel = new Carousel({
	autoPlayInterval: 2000,
	switcher: true,
	indicator: true,
	slides: [
		'red',
		'blue',
		'green'
	].map((color, index) => {
		const style = `height: 300px; text-align: center; background-color: ${color}`;
		return `<div style="${style}">${index + 1}</div>`;
	})
}).render();

document.getElementById('app').appendChild(carousel);
