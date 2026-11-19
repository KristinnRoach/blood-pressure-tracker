import{t as e}from"./index-BMx0Ul48.js";var t=class extends HTMLElement{constructor(){super(),this.min=0,this.max=1,this.step=.001,this.minimumGap=.001,this.valueMin=0,this.valueMax=1,this.activeThumb=null}connectedCallback(){this.render(),this.setupEventListeners(),this.updateSlider()}attributeChangedCallback(e,t,n){if(t===n||n===null)return;let r=parseFloat(n);switch(e){case`min`:this.min=r;break;case`max`:this.max=r;break;case`step`:this.step=r;break;case`minimum-gap`:this.minimumGap=r;break;case`value-min`:this.valueMin=r;break;case`value-max`:this.valueMax=r}this.isConnected&&this.updateSlider()}render(){this.innerHTML=`
      <div class="slider-track">
          <div class="slider-range"></div>
          <div class="slider-thumb thumb-min"></div>
          <div class="slider-thumb thumb-max"></div>
      </div>
    `}setupEventListeners(){let e=this.querySelector(`.thumb-min`),t=this.querySelector(`.thumb-max`);e.addEventListener(`mousedown`,e=>this.startDrag(e,`min`)),t.addEventListener(`mousedown`,e=>this.startDrag(e,`max`)),e.addEventListener(`touchstart`,e=>this.startDrag(e,`min`),{passive:!1}),t.addEventListener(`touchstart`,e=>this.startDrag(e,`max`),{passive:!1})}startDrag(e,t){e.stopPropagation(),e.preventDefault(),this.activeThumb=t;let n=e=>this.handleDrag(e),r=()=>this.stopDrag(n,r);document.addEventListener(`mousemove`,n),document.addEventListener(`mouseup`,r),document.addEventListener(`touchmove`,n,{passive:!1}),document.addEventListener(`touchend`,r)}handleDrag(e){if(!this.activeThumb)return;e.preventDefault();let t=`touches`in e&&e.touches[0]?e.touches[0].clientX:e.clientX,n=this.querySelector(`.slider-track`).getBoundingClientRect(),r=Math.max(0,Math.min(t-n.left,n.width))/n.width,i=this.min+r*(this.max-this.min);i=Math.round(i/this.step)*this.step,this.activeThumb===`min`?(i=Math.min(i,this.valueMax-this.minimumGap),this.valueMin=Math.max(i,this.min)):(i=Math.max(i,this.valueMin+this.minimumGap),this.valueMax=Math.min(i,this.max)),this.updateSlider(),this.dispatchChange()}stopDrag(e,t){this.activeThumb=null,document.removeEventListener(`mousemove`,e),document.removeEventListener(`mouseup`,t),document.removeEventListener(`touchmove`,e),document.removeEventListener(`touchend`,t)}updateSlider(){let e=this.querySelector(`.slider-range`),t=this.querySelector(`.thumb-min`),n=this.querySelector(`.thumb-max`);if(!e||!t||!n)return;let r=(this.valueMin-this.min)/(this.max-this.min)*100,i=(this.valueMax-this.min)/(this.max-this.min)*100,a=i-r;if(a<2){let e=(2-a)/2,o=Math.max(0,r-e),s=Math.min(100,i+e);t.style.left=`${o}%`,n.style.left=`${s}%`}else t.style.left=`${r}%`,n.style.left=`${i}%`;e.style.left=`${r}%`,e.style.width=`${i-r}%`}dispatchChange(){this.dispatchEvent(new CustomEvent(`range-change`,{detail:{min:this.valueMin,max:this.valueMax},bubbles:!0}))}setValues(e,t){this.valueMin=Math.max(this.min,Math.min(e,this.max)),this.valueMax=Math.max(this.min,Math.min(t,this.max)),this.valueMax-this.valueMin<this.minimumGap&&(this.valueMax=this.valueMin+this.minimumGap),this.updateSlider(),this.dispatchChange()}};e(t,`observedAttributes`,[`min`,`max`,`step`,`minimum-gap`,`value-min`,`value-max`]),customElements.define(`two-thumb-slider`,t);var n=document.createElement(`style`);n.textContent=`
two-thumb-slider {
  height: 20px;
  width: 100%;
  position: relative;
}

.slider-track {
  position: relative;
  height: 8px;
  background: #ddd;
  border-radius: 4px;
}

.slider-range {
  position: absolute;
  height: 8px;
  background: #4285f4;
  border-radius: 4px;
}

.slider-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #fff;
  border: 1px solid #4285f4;
  border-radius: 40%;
  top: -4px;
  margin-left: -8px;
  cursor: pointer;
}
`,document.head.append(n);export{t as TwoThumbSlider};