import hyper, {wire, Component} from 'hyperhtml';


class switcher extends Component {
	constructor({goPrevSlide, goNextSlide}) {
		super();
		this.setState({goPrevSlide, goNextSlide});
	}
	render(state = this.state) {
		return this.html`
			<div>
				<button type="button" class="prev" onclick=${state.goPrevSlide}></button>
				<button type="button" class="next" onclick=${state.goNextSlide}></button>
			</div>
		`;
	}
}

class indicator extends Component {
	constructor({slides, changeSlide}) {
		super();
		this.setState({
			items: slides.map(slide => wire()),
			changeSlide
		});
	}
	changeSlide(slide) {
		this.state.changeSlide(slide);
	}
	render(slide) {
		const getItemWire = index => this.state.items[index];
		return this.html`
			<ol>
				${this.state.items.map((item, index) =>
					getItemWire(index)`
						<li aria-current=${slide === index + 1} onclick=${this.changeSlide.bind(this, index + 1)}>${index + 1}</li>
					`
				)}
			</ol>
		`;
	}
}

class slide extends Component {
	constructor({index, html}) {
		super();
		this.setState({index, html});
	}
	render(slide) {
		const style = 'flex-basis: 100%; flex-shrink: 0';
		return this.html`
			<li style="${style}" aria-current=${slide === this.state.index}>${{html: this.state.html}}</li>
		`;
	}
}

class Carousel extends Component {
	get defaultState() {
		return {
			slide: 1, // slide index start from 1
			sliding: false,
			dragging: null,
			offset: 0,
			slides: [],
			items: [],
			className: 'slider',
			transitionDuration: '.8s',
			transitionTimingFunction: 'ease-in-out',
		};
	}
	constructor(props) {
		super();
		const {slides} = props;
		this.setState(Object.assign({}, props, {
			items: slides.slice(-1).concat(slides, slides.slice(0, 1)).map((html, index) => new slide({
				index,
				html
			}))
		}));
		this.setTimer();
		this.goPrevSlide = this.goPrevSlide.bind(this);
		this.goNextSlide = this.goNextSlide.bind(this);
		this.switcher = props.slides.length > 1 && props.switcher ? new switcher({
			goPrevSlide: this.goPrevSlide,
			goNextSlide: this.goNextSlide
		}) : null;
		this.indicator = props.slides.length > 1 && props.switcher ? new indicator({
			slides: props.slides,
			changeSlide: this.changeSlide.bind(this)
		}) : null;
		this.eventHandler = {
			handleEvent: event => {
				this['on' + event.type](event);
			}
		}
	}
	setTimer() {
		const interval = this.state.autoPlayInterval;
		if (this.state.slides.length > 1 && interval > 0) {
			this.clearTimer();
			this.timer = window.setInterval(this.changeSlide.bind(this, this.state.slide + 1), interval);
		}
	}
	clearTimer() {
		window.clearInterval(this.timer);
	}
	changeSlide(slide) {
		if (document.hidden) return; // run only when page is visible
		if (this.state.slideWillChange && !this.state.slideWillChange(slide, this.state.slide)) return;
		if (slide >= 0 && slide <= (this.state.slides.length + 1)) {
			this.setState({slide, sliding: true, dragging: null});
			this.setTimer();
		}
	}
	ontransitionend() { // this will not be triggered when document.hidden
		let {slide, slides} = this.state;
		const count = slides.length;
		if (slide == count + 1) slide = 1;
		if (slide == 0) slide = count;
		this.setState({slide, sliding: false});
		this.setTimer();
		this.state.slideDidChange && this.state.slideDidChange(slide);
	}
	onclick(event) {
		if (Math.abs(this.state.offset) < 25) return; // trigger click in a small distance
		event.preventDefault();
		event.stopPropagation();
	}
	ontouchstart(event) {
		if (event.touches)
			this.setState({dragging: {
				x: event.touches[0].pageX,
				y: event.touches[0].pageY
			}, offset: 0});
	}
	ontouchmove(event) {
		const {sliding, dragging} = this.state;
		if (sliding || !dragging || !event.touches) return;
		const x = event.touches[0].pageX;
		const y = event.touches[0].pageY;
		const offset = x - dragging.x;
		if (Math.abs(y - dragging.y) < Math.abs(offset)) event.preventDefault();
		this.setState({offset});
	}
	ontouchend(event) {
		const {slide, offset, dragging} = this.state;
		if (!dragging) return;
		this.setState({dragging: null});
		if (Math.abs(offset) > this.slider.clientWidth / 5)
			this.changeSlide(offset > 0 ? slide - 1 : slide + 1);
	}
	ontouchcancel(event) {
		this.ontouchend(event);
	}
	goPrevSlide() {
		this.changeSlide(this.state.slide - 1);
	}
	goNextSlide() {
		this.changeSlide(this.state.slide + 1);
	}
	render(state = this.state) {
		const {className, slide, slides, sliding, dragging, offset, transitionDuration, transitionTimingFunction} = state;
		const wrapperStyle = `
			position: relative;
			overflow-x: hidden;
			touch-action: pan-y pinch-zoom
		`;
		const sliderStyle = `
			list-style-type: none;
			padding: 0;
			margin: 0;
			display: flex;
			transition-property: ${sliding ? 'transform' : 'none'};
			transform: ${slides.length > 1 ? (dragging && offset !== 0 ? 'translateX(calc(' + (offset * 1) + 'px - ' + slide * 100 + '%))' : 'translateX(-' + slide * 100 + '%)') : null};
			transition-duration: ${transitionDuration};
			transition-timing-function: ${transitionTimingFunction};
			will-change: transform
		`;
		const slideStyle = 'flex-basis: 100%; flex-shrink: 0';

		const result = this.html`
			<div class="${className}" style="${wrapperStyle}">
				<ul
					style="${sliderStyle}"
					ontransitionend=${this.eventHandler}
					onclick=${this.eventHandler}
					ontouchstart=${this.eventHandler}
					ontouchmove=${this.eventHandler}
					ontouchend=${this.eventHandler}
					ontouchcancel=${this.eventHandler}
				>
					${state.items.map(item => item.render(slide))}
				</ul>
				${this.indicator && this.indicator.render(slide)}
				${this.switcher}
			</div>
		`;

		this.slider = result.querySelector(`${className} > ul`);

		return result;
	}
}

export default Carousel;
