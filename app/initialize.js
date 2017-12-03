const decoder = require('./decoder');

const EXPECTED_SIZE = 8832;

function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object

  // files is a FileList of File objects. List some properties.
  for (var i = 0, f; f = files[i]; i++) {
    handleFileObject(f);
  }
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/octet-stream,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function downloadCurrentFile() {
  download('test.kit', '');
}

function handleFileObject(f) {
  if (f.size !== EXPECTED_SIZE) {
    console.log(`File ${f.name} does not look like a Kit file.`)
    return;
  }

  var reader = new FileReader();

  // Closure to capture the file information.
  reader.onload = (function(theFile) {
    return function(e) {
      console.log(f, e.target.result);
    };
  })(f);

  // Read in the image file as a data URL.
  reader.readAsDataURL(f);
}

function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  var files = evt.dataTransfer.files; // FileList object.

  // files is a FileList of File objects. List some properties.
  for (var i = 0, f; f = files[i]; i++) {
    handleFileObject(f);
  }
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('files').addEventListener('change', handleFileSelect, false);

  // Setup the dnd listeners.
  var dropZone = document.getElementById('drop_zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);
});
