var bathroomTweaks = {
  n: {range:null, span:null},
  a: {range:null, span:null}
};
var livingroomTweaks = {
  n: {range:null, span:null},
  a: {range:null, span:null}
};
var kitchenTweaks = {
  n: {range:null, span:null},
  a: {range:null, span:null}
};
var garageTweaks = {
  n: {range:null, span:null},
  a: {range:null, span:null}
};

let graph2d;
let graph3d;
let vis3dDataset = new vis.DataSet();
let vis2dDataset = new vis.DataSet();
let drawFingerprintsPositions = true;

function getObjects(object, name) {
  object.a.range = document.getElementById("!ARange".replace('!',name));
  object.a.span = document.getElementById("!Aspan".replace('!',name));
  object.n.range = document.getElementById("!NRange".replace('!',name));
  object.n.span = document.getElementById("!Nspan".replace('!',name));

  object.a.range.value = params[name].A - globalA;
  object.a.span.innerHTML = Number(params[name].A - globalA).toPrecision(2);
  object.a.range.oninput = (event) => {
    params[name].A = globalA + Number(event.srcElement.value);
    object.a.span.innerHTML = Number(event.srcElement.value).toPrecision(2);
    draw();
  };

  object.n.range.value = params[name].n - globalN;
  object.n.span.innerHTML = Number(params[name].n - globalN).toPrecision(2);
  object.n.range.oninput = (event) => {
    params[name].n = globalN + Number(event.srcElement.value);
    object.n.span.innerHTML = Number(event.srcElement.value).toPrecision(2);
    draw();
  }
}

function init() {
  process();

  getObjects(bathroomTweaks, 'bathroom');
  getObjects(livingroomTweaks, 'livingroom');
  getObjects(kitchenTweaks, 'kitchen');
  getObjects(garageTweaks, 'garage');

  let cutoffRange = document.getElementById("cutoffRange");
  let cutoffSpan = document.getElementById("cutoffSpan");

  cutoffRange.value = CUTOFF_EXP;
  cutoffSpan.innerHTML = CUTOFF_EXP;
  cutoffRange.oninput = (event) => {
    CUTOFF_EXP = Number(event.srcElement.value);
    cutoffSpan.innerHTML = Number(event.srcElement.value).toPrecision(2);
    draw();
  };

  resolutionRange.value = blockSize;
  resolutionSpan.innerHTML = blockSize;
  resolutionRange.oninput = (event) => {
    blockSize = Number(event.srcElement.value);
    blockCount = width/blockSize;
    resolutionSpan.innerHTML = event.srcElement.value;
    draw();
  };

  var kitchenButton = document.getElementById("kitchenButton");
  var bathroomButton = document.getElementById("bathroomButton");
  var garageButton = document.getElementById("garageButton");
  var livingroomButton = document.getElementById("livingroomButton");
  
  kitchenButton.onclick = () => {LOCATION = 'kitchen'; draw()};
  bathroomButton.onclick = () => {LOCATION = 'bathroom'; draw()};
  garageButton.onclick = () => {LOCATION = 'garage'; draw()};
  livingroomButton.onclick = () => {LOCATION = 'livingroom'; draw()};
  
  var canvas = document.getElementById("canvasContainer");
  canvas.onclick = handleClick;
  canvas.onmousemove = handleMove;
  ctx = canvas.getContext("2d");

  draw();
}

function draw() {
  console.time('Draw')
  if (MODE === 'probability') {
    drawProbability();
  }
  else {
    drawRooms();
  }
  drawPos()

  console.timeEnd('Draw')
}



function drawProbability() {
  // background
  var img = document.getElementById("background");
  ctx.drawImage(img, 0, 0);

  var data = [];
  vis3dDataset.clear();
  // stones
  ctx.fillStyle = '#f00';
  var size = 40;
  for (var pos in positions) {
    if (usedInFingerprint[pos] === true) {
      var stone = positions[pos];
      ctx.beginPath()
      ctx.rect(stone[0] - 0.5 * size, stone[1] - 0.5 * size, size, size);
      ctx.fill();
      ctx.closePath();
    }
  }


  // get the highest and lowest values to map everything to [0..1]
  let highest = 0;
  let lowest = 0;
  for (let i = 0; i < blockCount; i++) {
    for (let j = 0; j < blockCount; j++) {
      let prob = 1;
      let count = 0;
      for (let stone in params) {
        if (params[stone].enabled && usedInFingerprint[stone] === true) {
          if (processedData[LOCATION][stone]) {
            let rawProb = getProbability(i * blockSize + 0.5 * blockSize, j * blockSize + 0.5 * blockSize, stone, LOCATION);
            prob *= rawProb;
            count += 1;
          }
        }
      }

      prob = processProbability(prob, count);

      highest = Math.max(highest ,prob);
      lowest = Math.min(lowest, prob);
    }
  }

  let range = highest - lowest;

  for (let i = 0; i < blockCount; i++) {
    for (let j = 0; j < blockCount; j++) {
      let prob = 1;
      let count = 0;
      for (let stone in params) {
        if (params[stone].enabled && usedInFingerprint[stone] === true) {
          if (processedData[LOCATION][stone]) {
            let rawProb = getProbability(i * blockSize + 0.5 * blockSize, j * blockSize + 0.5 * blockSize, stone, LOCATION);
            prob *= rawProb;
            count += 1;
          }
        }
      }

      prob = processProbability(prob, count);


      ctx.beginPath();

      let rawFactor = (prob - lowest) / range;
      let factor = Math.min(1,Math.max(0,rawFactor));


      let rgb = hsv2rgb((1-factor) * 270, 1, 1);
      let minOpacity = 0.4;
      if (factor < Math.pow(Math.pow(10,CUTOFF_EXP),4))
        minOpacity = 0.1;

      data.push({x:i*blockSize+0.5*blockSize, y:j*blockSize+0.5*blockSize, z:prob, style:factor})

      ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (factor*(1-minOpacity) + minOpacity) + ')';
      ctx.rect(i*blockSize,j*blockSize,blockSize,blockSize);
      ctx.fill();
      ctx.closePath();
    }
  }
  vis3dDataset.update(data)
}

function processProbability(prob, count) {
  // return prob;
  return Math.pow(prob, 1/count);
}

function drawRooms() {
  // background
  var img = document.getElementById("background");
  ctx.drawImage(img, 0, 0);

  var visdata = [];
  vis3dDataset.clear();

  let colors = {
    kitchen: 'rgba(255,0,0,0.5)',
    garage: 'rgba(0,255,0,0.5)',
    bathroom: 'rgba(255,230,0,0.5)',
    livingroom: 'rgba(0,0,255,0.5)',
  };

  let colors3d = {
    kitchen: 1,
    garage: 0.6,
    bathroom: 0.8,
    livingroom: 0.2,
  };

  let cutoff = Math.pow(10, CUTOFF_EXP)
  for (let i = 0; i < blockCount; i++) {
    for (let j = 0; j < blockCount; j++) {
      let blockProbability = {};
      let count = 0;
      for (let location in data) {
        if (usedInFingerprint[location] === true) {
          count = 0;
          let prob = 1;
          for (let stone in params) {
            if (params[stone].enabled && usedInFingerprint[stone] === true) {
              if (processedData[location][stone]) {
                let rawProb = getProbability(i * blockSize + 0.5 * blockSize, j * blockSize + 0.5 * blockSize, stone, location);
                prob *= rawProb;
                count += 1;
              }
            }

          }
          blockProbability[location] = processProbability(prob, count);
        }
      }
      let highest = null;
      let highestValue = 0;
      for (let location in blockProbability) {
        if (blockProbability[location] > highestValue) {
          highestValue = blockProbability[location];
          highest = location;
        }
      }
      ctx.beginPath();
      ctx.fillStyle = colors[highest];
      let color3D = false;
      if (highestValue < Math.pow(cutoff, count)) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)'
        color3D = 0.0001;
      }

      visdata.push({x:-i * blockSize + 0.5 * blockSize, y: j * blockSize + 0.5 * blockSize, z:highestValue, style:color3D || colors3d[highest]})

      ctx.rect(i*blockSize,j*blockSize,blockSize,blockSize);
      ctx.fill();
      ctx.closePath();
    }
  }

  vis3dDataset.update(visdata);

  // stones
  for (var pos in positions) {
    if (usedInFingerprint[pos] === true) {
      var size = 46;
      var stone = positions[pos];
      ctx.beginPath();
      ctx.fillStyle = '#000';
      ctx.rect(stone[0] - 0.5 * size, stone[1] - 0.5 * size, size, size);
      ctx.fill();
      ctx.closePath();

      size -= 10;
      ctx.beginPath();
      ctx.fillStyle = colors[pos].replace("0.5", 1);
      ctx.rect(stone[0] - 0.5 * size, stone[1] - 0.5 * size, size, size);
      ctx.fill();
      ctx.closePath();
    }
  }

}

function handleMove(evt) {
  if (start.enabled === true && end.locked === false) {
    end.x = evt.x;
    end.y = evt.y;
    draw()
  }
}

function handleClick(evt) {
  if (start.enabled === false) {
    start.x = evt.x;
    start.y = evt.y;
    start.enabled = true;
    end.x = evt.x;
    end.y = evt.y;
    end.locked = false;
    draw()
  }
  else if (end.locked === false) {
    end.locked = true;
    draw();
    updateVis()
  }
  else {
    end.locked = false;
    start.enabled = false;
    clearVis();
    draw();
  }

}

function drawPos() {
  if (start.enabled) {
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.circle(start.x, start.y, 30);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.circle(start.x, start.y, 20);
    ctx.fill();
    ctx.closePath();


    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.circle(end.x, end.y, 30);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = '#f00';
    ctx.circle(end.x, end.y, 20);
    ctx.fill();
    ctx.closePath();
  }
}


function visInit2d() {
  var container = document.getElementById('graph');

  var options = {
    start: 0,
    end: 100
  };
  graph2d = new vis.Graph2d(container, visDataset, options);
}

function visInit3d() {
  var container = document.getElementById('graph');

  var options = {
    width:  '900px',
    height: '552px',
    style: 'bar-color',
    showPerspective: true,
    showGrid: true,
    showShadow: false,
    keepAspectRatio: true,
    verticalRatio: 0.5
  };

  graph3d = new vis.Graph3d(container, vis3dDataset, options);
}
function clearVis() {
  visDataset.clear();
}
function updateVis3d() {
  clearVis();
  let items = [];

  let dx = end.x - start.x;
  let dy = end.y - start.y;
  let length = Math.sqrt(dx*dx + dy*dy);

  let ddx = dx / length;
  let ddy = dy / length;

  for (let i = 0; i < length; i++) {
    let prob = 1;
    for (let stone in params) {
      if (params[stone].enabled && usedInFingerprint[stone] === true) {
        let rawProb = getProbability(start.x + i*ddx, start.y + i*ddy, stone, LOCATION);
        prob *= rawProb;
      }
    }
    ctx.beginPath();
    ctx.fillStyle = 'rgba('+ Math.floor(255*(i/length))+ ',0,0,1)';
    ctx.circle(start.x + i*ddx, start.y + i*ddy, 2);
    ctx.fill();
    ctx.closePath();
    items.push({x:(i/length * length), y:prob})
  }

  visDataset.update(items)
  graph2d.fit();
}
function updateVis2d() {
  clearVis();
  let items = [];

  let dx = end.x - start.x;
  let dy = end.y - start.y;
  let length = Math.sqrt(dx*dx + dy*dy);

  let ddx = dx / length;
  let ddy = dy / length;

  for (let i = 0; i < length; i++) {
    let prob = 1;
    for (let stone in params) {
      if (params[stone].enabled && usedInFingerprint[stone] === true) {
        let rawProb = getProbability(start.x + i*ddx, start.y + i*ddy, stone, LOCATION);
        prob *= rawProb;
      }
    }
    ctx.beginPath();
    ctx.fillStyle = 'rgba('+ Math.floor(255*(i/length))+ ',0,0,1)';
    ctx.circle(start.x + i*ddx, start.y + i*ddy, 2);
    ctx.fill();
    ctx.closePath();
    items.push({x:(i/length * length), y:prob})
  }

  visDataset.update(items)
  graph2d.fit();
}