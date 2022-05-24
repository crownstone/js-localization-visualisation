function process() {
  for (var location in data) {
    if (usedInFingerprint[location] === true) {
      processedData[location] = {};
      let fingerprint = data[location];
      for (var stone in fingerprint) {
        let stoneData = fingerprint[stone];
        let mean = getMean(stoneData,stone);
        let std = getStd(stoneData,mean,stone);
        processedData[location][stone] = {mean:mean, std:std};
      }
    }
  }
}

function getMean(measurements,stone) {
  var total = 0;
  measurements.forEach((element) => {
    if (useDistance) {
      total += getDistanceFromRssi(element,stone);
    }
    else {
      total += element;
    }
  })
  return (total / measurements.length)
}

function getStd(measurements, mean,stone) {
  var total = 0;
  measurements.forEach((element) => {
    if (useDistance) {
      total += Math.pow(getDistanceFromRssi(element,stone) - mean,2);
    }
    else {
      total += Math.pow(element - mean,2);
    }
  });
  var variance = (total / measurements.length);
  return Math.sqrt(variance);
}

function getDistanceFromRssi(rssi,stoneId) {
  let distance = Math.pow(10,(-(rssi + params[stoneId].A)/(10 * params[stoneId].n)));
  return distance;
}

function getRSSI(distance, stoneId) {
  let rssi = -(10*params[stoneId].n)*Math.log10(distance) - params[stoneId].A;
  return rssi;
}

function getProbability(x,y,stoneId,locationId) {
  let dx = x-positions[stoneId][0];
  let dy = y-positions[stoneId][1];
  let distance = Math.sqrt(dx*dx + dy*dy)/px2m;
  let rssi = getRSSI(distance, stoneId);


  let stoneData = processedData[locationId][stoneId];

  let exponent;
  if (useDistance) {
    exponent = Math.exp(-(Math.pow(distance - stoneData.mean,2)/(2*Math.pow(stoneData.std,2))));
  }
  else {
    exponent = Math.exp(-(Math.pow(rssi - stoneData.mean,2)/(2*Math.pow(stoneData.std,2))));
  }

  let prob = exponent / (Math.sqrt(2*Math.PI) * stoneData.std);
  // console.log(distance, prob, stoneData.mean)
  return prob;
}

function toggleFingerprint(source) {
  drawFingerprintsPositions = source.checked;
  draw()
}

function toggleKitchen(source) {
  params['kitchen'].enabled = source.checked;
  draw()
}

function toggleGarage(source) {
  params['garage'].enabled = source.checked;
  draw()
}

function toggleBathroom(source) {
  params['bathroom'].enabled = source.checked;
  draw()
}

function toggleLivingroom(source) {
  params['livingroom'].enabled = source.checked;
  draw()
};

function toggleKitchenFingerprint(source) {
  usedInFingerprint['kitchen'] = source.checked;
  draw()
}

function toggleGarageFingerprint(source) {
  usedInFingerprint['garage'] = source.checked;
  draw()
}

function toggleBathroomFingerprint(source) {
  usedInFingerprint['bathroom'] = source.checked;
  draw()
}

function toggleLivingroomFingerprint(source) {
  usedInFingerprint['livingroom'] = source.checked;
  draw()
};

function toggleProbability() {
  MODE = "probability";
  draw()
}

function toggleRooms() {
  MODE = "rooms";
  draw()
}


function toggleRSSI() {
  useDistance = false;
  init()
}

function toggleDistance() {
  useDistance = true;
  init()
}