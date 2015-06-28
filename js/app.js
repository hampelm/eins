'use strict';
/*globals Highcharts, data, NTEES */

/*
TODO
- Ensure there are no duplicate orgs
- Better understand what TAX_PERIOD means
- What to blank TAX_PERIODs mean?
- Sum organizations that don't have an NTEE code
  (do they have commonalities?)
- Potentially exclude
*/

window.onload = function () {
  var TITLE = 'Annual Income';
  var VALUE_KEY = 'INCOME_AMT'; // INCOME_AMT, REVENUE_AMT, ASSET_AMT

  var COLORS = [
    '#0036cc',
    '#0036cc',
    '#0088cc',
    '#ff7300',
    '#b200cc',
    '#ecf900',
    '#3b00cc',
    '#ff1900',
    '#ffd900',
    '#00cc3b',
    '#0088cc',
    '#df0054',
    '#df0054',
    '#ecf900',
    '#ff1900',
    '#ffd900',
    '#00cc3b',
    '#ffa600',
    '#ff7300',
    '#ffa600',
    '#0088cc',
    '#ff7300',
    '#b200cc',
    '#3b00cc',
    '#0036cc',
    '#b200cc',
    '#ecf900',
    '#3b00cc',
    '#ff1900',
    '#ffd900',
    '#00cc3b',
    '#df0054',
    '#ffa600'
  ];

  var i, ntee, topNtee, p;
  var points = [];

  for (i = 0; i < data.length; i++) {
    data[i][VALUE_KEY] = parseInt(data[i][VALUE_KEY], 10);
  }

  function findNTEE(code) {
    // Skip pension funds
    if (code[0] === 'Y') {
      return undefined;
    }

    // Skip really short NTEE codes
    if (code.length <= 1) {
      return;
    }

    var ntee = NTEES[code];

    // If we can't find that code, try one less specific
    if (!ntee) {
      console.log("Can't find", code, "trying", code.slice(0, - 1));
      ntee = NTEES[code.slice(0, - 1)];
      if (ntee) {
        console.log("OK", ntee);
      }
    }

    return ntee;
  }

  // Add all the top-level NTEE codes
  _.each(NTEES, function(val, key) {

    var value = _.sum(data, function(d) {
      if (d.NTEE_CD[0] === key) {
        return d[VALUE_KEY];
      }
    });

    // Skip the pension category
    if (key.length === 1 && key !== "Y") {
      points.push({
        id: key,
        name: val.title,
        value:  value,
        color: COLORS[points.length]
      });
    }
  });


  // Get all the distinct NTEE codes in the source data
  var codes = _.uniq(_.pluck(data, 'NTEE_CD'));
  _.each(codes, function(code) {
    var ntee = findNTEE(code);
    if (!ntee) {
      return;
    }

    var value = _.sum(data, function(d) {
      if (d.NTEE_CD === code) {
        return d[VALUE_KEY];
      }
    });

    points.push({
      id: code,
      parent: code[0], // the first letter is the parent code
      name: ntee.title,
      value: value
    });
  });


  // Add all the source data
  for (i = 0; i < data.length; i++) {

    var parent = findNTEE(data[i].NTEE_CD);
    if (!parent) {
      // console.log("NO PARENT FOR", data[i]);
      continue;
    }

    points.push({
      id: data[i].EIN,
      name: data[i].NAME,
      parent: data[i].NTEE_CD,
      value: data[i][VALUE_KEY]
    });
  }

  console.log("Using point data", points);

  var chart = new Highcharts.Chart({
    chart: {
      renderTo: 'chart'
    },
    series: [{
      turboThreshold: 0,
      type: "treemap",
      layoutAlgorithm: 'squarified',
      allowDrillToNode: true,
      dataLabels: {
        enabled: false
      },
      levelIsConstant: false,
      levels: [{
        level: 1,
        dataLabels: {
          enabled: true
        },
        borderWidth: 3
      }],
      data: points
    }],
    subtitle: {
      text: 'Click points to drill down. Source: <a href="http://www.irs.gov/Charities-&-Non-Profits/Exempt-Organizations-Business-Master-File-Extract-EO-BMF">IRS</a>.'
    },
    plotOptions: {
      treemap: {
        tooltip: {
          pointFormatter:  function() {
            var s = '<b>' + this.name + '</b>: $';
            s += this.value.toLocaleString() + '<br>';
            return s;
          }
        }
      }
    },
    title: {
      text: TITLE
    }
  });
};
