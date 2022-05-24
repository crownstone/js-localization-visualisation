let processedData = {};
let ctx;
let LOCATION = 'livingroom';
let MODE = 'rooms'; // probability or rooms
let CUTOFF_EXP = -3;

let useDistance = true;

let start = {x:200,y:200,enabled:false}
let end = {x:100,y:100,locked:false}