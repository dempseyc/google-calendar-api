const rrulestr = require('rrule').rrulestr;
const { DateTime } = require('luxon');

class CALMAKER {

    constructor() {
        this.myNum = 9;
        this.vevent = undefined;
        this.bucketDefinitions = undefined;
    }

    methForTesting (num1,num2) {
        return num1+num2;
    }

    methWithThisForTesting () {
        return this.myNum;
    }

    meth2WithThisForTesting (num) {
        this.myNum = num;
        let result = this.methForTesting(1,this.myNum);
        return result;
    }

    // setLatestDateFilter: (earliestdatefilter,tSpan) => {
    //     // not implemented
    //     // tSpan is obj with properties 'unit' and 'number'
    //     return earliestdatefilter;
    // },

    extractRRULEobj (rrule, eventdate) {
        let rruleObj = rrulestr(`${eventdate}\n${rrule}`);
        return rruleObj;
    }

    currItemsRRextracted (items, eventdate) {
        let rrextracted = items.map( (item) => {
            if (item.RRULE) {
                item.RRULE = this.extractRRULE(item.RRULE, eventdate);
            }
            return item;
        })
        return rrextracted;
    }

    filterByEarliest (veventData, earliestdatefilter, now, latestdatefilter, returnCount) {
        // console.log(items, "in fd");
        let currItems = veventData.filter( (item) => {
            if(!item.RRULE && earliestdatefilter<=now) {
                return false;
            } else {
                return true;
            }
        });
        return currItems;
    }  // end filterByEarliest

    processData (JSONdata) {
        let items = JSONdata.VCALENDAR[0].VEVENT; // should be array
        //filter by earliest
        //extrapolate from rrrules
        //set up buckets by # limit
        //return first bucket
        let newVeventList = this.filterByEarliest(items);
        JSONdata.VCALENDAR[0].VEVENT = newVeventList;
        return JSONdata;
    }

}

module.exports = new CALMAKER();