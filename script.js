class Cursor {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.state = null;
    this.x = null
    this.y = null;
  }
  
  setPosition(x,y) {
    this.element.style.left = x + 'px';
    this.element.style.top = y + 'px';
  }
  
  getCentre() {
    const rect = this.element.getBoundingClientRect();
    this.x =  rect.left + rect.width / 2;
    this.y = rect.top + rect.height / 2;
    return {
      x: this.x,
      y: this.y
    };
  }
  
  setState(icon) {
    if (icon === 'pointing') {
      this.show();
      this.element.style.backgroundImage = "url('assets/pointerhand.png')";
      this.state = 'pointing';
    }
    else if (icon === 'default') {
      this.show();
      this.element.style.backgroundImage = "url('assets/cursor.png')";
      this.state = 'default';
    }
  }
  
  hide() {
    this.element.style.display = 'none';
    this.state = 'hidden';
    handleInteractions();
  }
  
  show() {
    this.element.style.display = 'block';
  }
}

const defaultParams = {
    flipHorizontal: true,
    outputStride: 16,
    maxNumBoxes: 1,
    iouThreshold: 0.5,
    scoreThreshold: 0.7,
};

const video = document.getElementById('video');
let model;
let hoverStartTime = null;
let currentEl = null;
let interactTime = null;
let hoverTimer = null;
let interval = null;
const cursor = new Cursor('cursor');

handTrack.startVideo(video).then(status => {
  if (status) {
    console.log('Video started.');
    handTrack.load(defaultParams).then(lmodel => {
      model = lmodel;
      detectLoop();
    });
  }
});

function detectLoop() {
      model.detect(video).then(predictions => {
        predictions = predictions.filter(prediction => prediction.label !== 'face');
        //If a hand was detected...
        if (predictions.length > 0) {
          cursor.show();
          interactTime = Date.now();
          adjustCursor(predictions[0])
          handleInteractions(predictions[0].label);
        }
        else {
          if (Date.now() - interactTime >= 3000) {
            cursor.hide();
          }
        }
        
        //Loop detectLoop() 
        requestAnimationFrame(detectLoop);
      });
}

function adjustCursor(hand) {
  const [x, y, width, height] = hand.bbox;
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  const videoRect = video.getBoundingClientRect();
  
  const scaleX = videoRect.width / video.width;
  const scaleY = videoRect.height / video.height;
  cursor.setPosition((centerX * scaleX), (centerY * scaleY));
}

function handleInteractions(label) {
  const {x, y} = cursor.getCentre();
  const newEl = document.elementFromPoint(x,y);
  
  // If the cursor goes over a new element...
  if (newEl !== currentEl) {
    
    //If you just left a selection-button, dispatch mouseout event
    if (currentEl && currentEl.classList.contains('selection-button')) {
      if (!cursor.state == 'hidden') {
        cursor.setState('default');
      }
      currentEl.dispatchEvent(new MouseEvent('mouseout', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    }
    
    // If you enter a selection-button, dispatch mouseover event
    if (newEl && newEl.classList.contains('selection-button')) {
      cursor.setState('pointing');
      newEl.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        cancleable: true,
        view: window
      }));
    }
    
    currentEl = newEl;
  }
  // If the cursor is on the same element...
  else {
    console.log([currentEl, label]);
    // ...and that element is the same button with a closed hand, dispatch click event
    if (currentEl && currentEl.classList.contains('selection-button' && label == 'closed')) {
      currentEl.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancleable: true,
        view: window
      }));
    }
  }
  
}

document.querySelectorAll('.selection-button').forEach(button => {
  //onmouseover:
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = 'grey';
    
  });
  //onmouseout:
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '';
  });
  //onclick
  button.addEventListener('click', () => {
    alert("Click registered!");
  });
});
