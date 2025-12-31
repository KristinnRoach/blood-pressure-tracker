var v=Object.defineProperty;var p=(h,t,e)=>t in h?v(h,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):h[t]=e;var u=(h,t,e)=>p(h,typeof t!="symbol"?t+"":t,e);class l extends HTMLElement{constructor(){super(),this.min=0,this.max=1,this.step=.001,this.minimumGap=.001,this.valueMin=0,this.valueMax=1,this.activeThumb=null}connectedCallback(){this.render(),this.setupEventListeners(),this.updateSlider()}attributeChangedCallback(t,e,i){if(e===i||i===null)return;const s=parseFloat(i);switch(t){case"min":this.min=s;break;case"max":this.max=s;break;case"step":this.step=s;break;case"minimum-gap":this.minimumGap=s;break;case"value-min":this.valueMin=s;break;case"value-max":this.valueMax=s;break}this.isConnected&&this.updateSlider()}render(){this.innerHTML=`
      <div class="slider-track">
          <div class="slider-range"></div>
          <div class="slider-thumb thumb-min"></div>
          <div class="slider-thumb thumb-max"></div>
      </div>
    `}setupEventListeners(){const t=this.querySelector(".thumb-min"),e=this.querySelector(".thumb-max");t.addEventListener("mousedown",i=>this.startDrag(i,"min")),e.addEventListener("mousedown",i=>this.startDrag(i,"max")),t.addEventListener("touchstart",i=>this.startDrag(i,"min"),{passive:!1}),e.addEventListener("touchstart",i=>this.startDrag(i,"max"),{passive:!1})}startDrag(t,e){t.stopPropagation(),t.preventDefault(),this.activeThumb=e;const i=n=>this.handleDrag(n),s=()=>this.stopDrag(i,s);document.addEventListener("mousemove",i),document.addEventListener("mouseup",s),document.addEventListener("touchmove",i,{passive:!1}),document.addEventListener("touchend",s)}handleDrag(t){if(!this.activeThumb)return;t.preventDefault();const e="touches"in t&&t.touches[0]?t.touches[0].clientX:t.clientX,s=this.querySelector(".slider-track").getBoundingClientRect();let r=Math.max(0,Math.min(e-s.left,s.width))/s.width,a=this.min+r*(this.max-this.min);a=Math.round(a/this.step)*this.step,this.activeThumb==="min"?(a=Math.min(a,this.valueMax-this.minimumGap),this.valueMin=Math.max(a,this.min)):(a=Math.max(a,this.valueMin+this.minimumGap),this.valueMax=Math.min(a,this.max)),this.updateSlider(),this.dispatchChange()}stopDrag(t,e){this.activeThumb=null,document.removeEventListener("mousemove",t),document.removeEventListener("mouseup",e),document.removeEventListener("touchmove",t),document.removeEventListener("touchend",e)}updateSlider(){const t=this.querySelector(".slider-range"),e=this.querySelector(".thumb-min"),i=this.querySelector(".thumb-max");if(!t||!e||!i)return;const s=(this.valueMin-this.min)/(this.max-this.min)*100,n=(this.valueMax-this.min)/(this.max-this.min)*100,r=2,a=n-s;if(a<r){const m=(r-a)/2,d=Math.max(0,s-m),c=Math.min(100,n+m);e.style.left=`${d}%`,i.style.left=`${c}%`}else e.style.left=`${s}%`,i.style.left=`${n}%`;t.style.left=`${s}%`,t.style.width=`${n-s}%`}dispatchChange(){this.dispatchEvent(new CustomEvent("range-change",{detail:{min:this.valueMin,max:this.valueMax},bubbles:!0}))}setValues(t,e){this.valueMin=Math.max(this.min,Math.min(t,this.max)),this.valueMax=Math.max(this.min,Math.min(e,this.max)),this.valueMax-this.valueMin<this.minimumGap&&(this.valueMax=this.valueMin+this.minimumGap),this.updateSlider(),this.dispatchChange()}}u(l,"observedAttributes",["min","max","step","minimum-gap","value-min","value-max"]);customElements.define("two-thumb-slider",l);const o=document.createElement("style");o.textContent=`
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
`;document.head.append(o);export{l as TwoThumbSlider};
