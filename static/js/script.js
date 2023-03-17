// subject = metro
// topic = city
// chapter = neighborhood

var subjectObject = {
  "SF": {
    "SF": ['alamo square / nopa', 'bayview', 'bernal heights', 'castro / upper market', 'cole valley / ashbury hts', 'downtown / civic / van ness',
          'excelsior / outer mission', 'financial district', 'glen park', 'haight ashbury', 'hayes valley', 'ingleside / SFSU / CCSF', 'inner richmond',
           'inner sunset / UCSF', 'laurel hts / presidio', 'lower haight', 'lower nob hill','lower pac hts', 'marina / cow hollow', 'mission district',
            'nob hill', 'noe valley', 'north beach / telegraph hill', 'pacific heights', 'portola district', 'potrero hill', 'richmond / seacliff', 'russian hill',
            'SOMA / south beach', 'sunset / parkside', 'tenderloin','treasure island', 'twin peaks / diamond hts', 'USF / panhandle', 'visitacion valley',
             'west portal / forest hill', 'western addition']
  },
  "Peninsula": {
     "San Mateo": ['san mateo','atherton','belmont','brisbane','half moon bay','millbrae','pacifica','portola valley','san carlos','woodside', 'coastside/pescadero'],
    "Daly city": ['daly city'],
    "San Bruno": ['san bruno'],
    "South San Francisco":['south san francisco'],
    "Redwood City":['redwood city','redwood shores'],
    "Foster City":['foster city'],
    "Burlingame":['burlingame'],
    "Palo Alto":['palo alto','east palo alto'],
    "Mountain View":['mountain view','los altos'],
    "Menlo Park":['menlo park']

  },
    "East Bay": {
      "Oakland": ['oakland downtown','oakland east','oakland hills / mills','oakland lake merritt / grand','oakland north / temescal','oakland piedmont / montclair','oakland rockridge / claremont','oakland west'],
      "Berkeley": ['berkeley','berkeley north / hills','brentwood / oakley'],
      "Fremont":['fremont / union city / newark'],
      "Walnut Creek":['walnut creek'],
      "Concord":['concord / pleasant hill / martinez','lafayette / orinda / moraga'],
      "Hayward":['hayward / castro valley'],
      "Alameda":['alameda'],
      "Pleasanton":['dublin / pleasanton / livermore'],
      "San Leandro":['san leandro'],
      "Vallejo":['vallejo / benicia'],
      "San Ramon":['danville / san ramon'],
      "Emeryville":['emeryville'],
      "Dublin":['dublin / pleasanton / livermore'],
      "Richmond":['richmond / point / annex','hercules, pinole, san pablo, el sob'],
      "Fairfield":['fairfield / vacaville'],
      "Livermore":['dublin / pleasanton / livermore'],
      "Antioch":['pittsburg / antioch'],
      "Pittsburg":['pittsburg / antioch'],
      "Union City":['fremont / union city / newark'],
      "El Cerrito":['albany / el cerrito']
  }
}

function getFormData(form) {
  return Object.fromEntries(new FormData(form));
}

function displayRent(rent) {
    var data = [
      {
        type: "indicator",
        mode: "gauge+number",
        value: rent,
        title: { text: "Market Rent", font: { size: 24 } },
        gauge: {
          axis: { range: [3500*0.9, 3500*1.1], tickwidth: 1, tickcolor: "black" },
          bar: { color: "black" },
          bgcolor: "white",
          borderwidth: 2,
          bordercolor: "white",
          steps: [
            { range: [0, 3200], color: "red" },
            { range: [3200, 3400], color: "orange" },
            { range: [3400, 3600], color: "green" },
            { range: [3600, 4000], color: "orange" }
          ],
          threshold: {
            line: { color: "red", width: 0 },
            thickness: 0.75,
            value: 3200
          }
        }
      }
    ];

    var layout = {
      width: 500,
      height: 400,
      margin: { t: 25, r: 25, l: 25, b: 25 },
      paper_bgcolor: "white",
      font: { color: "darkblue", family: "Arial" }
    };

    Plotly.newPlot('rent', data, layout);
}

window.onload = function() {
  var subjectSel = document.getElementById("subject");
  var topicSel = document.getElementById("topic");
  var chapterSel = document.getElementById("chapter");
  for (var x in subjectObject) {
    subjectSel.options[subjectSel.options.length] = new Option(x, x);
  }
  subjectSel.onchange = function() {
    //empty chapters- and citys- dropdowns
    chapterSel.length = 1;
    topicSel.length = 1;
    //display correct values
    for (var y in subjectObject[this.value]) {
      topicSel.options[topicSel.options.length] = new Option(y, y);
    }
  }
  topicSel.onchange = function() {
    //empty chapters dropdown
    chapterSel.length = 1;
    //display correct values
    var z = subjectObject[subjectSel.value][this.value];
    for (var i = 0; i < z.length; i++) {
      chapterSel.options[chapterSel.options.length] = new Option(z[i], z[i]);
    }
  }

  var buttonSel = document.getElementById("button");
  buttonSel.onclick = function() {
    var formSel = document.getElementById("form");
    var data = getFormData(formSel);
    fetch("/predict_rent", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-type": "application/json"
      }
    })
    .then((response) => response.json())
    .then((json) => displayRent(json.prediction));
  }
}