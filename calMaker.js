const rrulestr = require('rrule').rrulestr;

let CALMAKER = {

    myNum: undefined,

    vevent: undefined,
    bucketDefinitions: undefined,

    funcForTesting: (num1,num2) => {
        return num1+num2;
    },

    funcWithThisForTesting: (num) => {
        this.myNum = num;
        return this.myNum;
    },

    // setLatestDateFilter: (earliestdatefilter,tSpan) => {
    //     // not implemented
    //     // tSpan is obj with properties 'unit' and 'number'  like '4M'
    //     return earliestdatefilter;
    // },

    extractRRULEobj: (rrule, eventdate) => {
        let rruleObj = rrulestr(`${eventdate}\n${rrule}`);
        return rruleObj;
    },

    currItemsRRextracted: (items, eventdate) => {
        let rrextracted = items.map( (item) => {
            if (item.RRULE) {
                item.RRULE = extractRRULE(item.RRULE, eventdate);
            }
            return item;
        })
        return rrextracted;
    },

    filterByEarliest: (veventData, earliestdatefilter, now, latestdatefilter, returnCount) => {
        // console.log(items, "in fd");
        let currItems = veventData.filter( (item) => {
            if(!item.RRULE && earliestdatefilter<=now) {
                return false;
            } else {
                return true;
            }
        });
        return currItems;
    },  // end filterByEarliest

    processData: (JSONdata) => {
        let items = JSONdata.VCALENDAR[0].VEVENT; // should be array
        //filter by earliest
        //extrapolate from rrrules
        //set up buckets by # limit
        //return first bucket
        let newVeventList = filterByEarliest(items);
        JSONdata.VCALENDAR[0].VEVENT = newVeventList;
        return JSONdata;
    }

}

module.exports = CALMAKER;