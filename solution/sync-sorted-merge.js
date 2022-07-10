"use strict";
const Heap = require("mnemonist/heap");

// Print all entries, across all of the sources, in chronological order.
module.exports = (logSources, printer) => {
  const sources = new Set();
  const heap = new Heap(function (a, b) {
    return a.date - b.date;
  });
  let entry;

  // put the first elements on log source on heap and make a 
  // list of parent that represent the sources ids
  for (let [key, logs] of logSources.entries()) {
    entry = logs.pop();
    const logEntry = { ...entry, parent: key };
    heap.push(logEntry);
    sources.add(key);
  }

  // print source elements
  while ((entry = heap.pop())) {
    printer.print(entry);
    let parent = entry.parent;
    while (!(entry = logSources[parent].pop()) && sources.size) {
      // here the source has been drained we need to remove it
      sources.delete(parent);
      if (sources.size) {
        // move parent for the next one
        parent = sources.values().next().value;
      }
    }
    // add parent and add element to heap
    if (sources.size) {
      entry.parent = parent;
      heap.push(entry);
    }
  }
  printer.done();
  return console.log("Sync sort complete.");
};
