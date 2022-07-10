"use strict";
const Heap = require("mnemonist/heap");

// Print all entries, across all of the *async* sources, in chronological order.
module.exports = (logSources, printer) => {
  return new Promise((resolve, reject) => {
    const sources = new Set();
    const maxHeapSize = 10000000;
    const bulkSize = 50;
    const heap = new Heap((a, b) => {
      return a.date - b.date;
    });

    // put the first elements on log source on heap and make a
    // list of parent that represent the sources ids
    const mapFirstElements = async (sourceId, logSource) => {
      const logHead = await logSource.popAsync();
      if (logHead) {
        heap.push({ ...logHead, sourceId });
        sources.add(sourceId);
        if (sources.size === logSources.length) traverseHeap();
      }
    };

    //Traverse elements on heap
    const traverseHeap = async () => {
      if (heap.size == 0 && sources.size == 0) {
        printer.done();
        return;
      }
      const log = heap.pop();
      if (!log) return;

      const sourceId = log.sourceId;
      printer.print(log);
      if (heap.size < maxHeapSize) {
        const sourceSpaces = [...Array(bulkSize).keys()];
        Promise.all(
          sourceSpaces.map((i) => visitLogs((sourceId + i) % logSources.length))
        ).then(() => {});
      }
      visitLogs(sourceId).then(() => {
        traverseHeap();
      });
    };

    //Deeple visit each log source and put the elements to heap
    const visitLogs = (sourceId) => {
      if (sources.size == 0) return Promise.resolve();

      return logSources[sourceId].popAsync().then(function (entry) {
        if (entry) {
          heap.push({ ...entry, sourceId });
          return;
        } else {
          sources.delete(sourceId);
          if (sources.size == 0) return Promise.resolve();
          sourceId = sources.values().next().value;
          return visitLogs(sourceId);
        }
      });
    };

    //Initializer
    const getAllEntries = async () => {
      for (const [sourceId, logSource] of logSources.entries()) {
        await mapFirstElements(sourceId, logSource);
      }
    };

    resolve(getAllEntries());
  });
};
