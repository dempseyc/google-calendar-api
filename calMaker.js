const rrulestr = require('rrule').rrulestr;
const { DateTime } = require('luxon');

class CALMAKER {

    constructor() {
        this.myNum = 9;
        this.vevent = undefined;
        this.bucketDefinitions = undefined; 
        this.now = new Date();
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

    // SPLIT UP DTSTART AND Timezone
    separateDTSTARTandTZID (item) {
        let pattern = /TZID/;
        let TZID, DTSTART ;
        for (let key in item) {
            if ( pattern.test(key) ) {
                TZID = key.split('=')[1];
                DTSTART = item[key];
            }
        }

        return {
            "TZID": TZID,
            "DTSTART": DTSTART
        }
    }

    utcDateStrToJSDate (str) {
        let y = str.substr(0,4);
        let m = str.substr(4,2) - 1;
        let d = str.substr(6,2);
        let hr = str.substr(9,2);
        let min = str.substr(11,2);
        return new Date(Date.UTC(y,m,d,hr,min));
    }

    createLocationString (rawLocation) {
        return rawLocation.split('\\').join(' ');
    }

    createDateStr (DTSTARTjs) {
        let months = ['1','2','3','4','5','6','7','8','9','10','11','12'];
        let hours = ['1','2','3','4','5','6','7','8','9','10','11','12','1','2','3','4','5','6','7','8','9','10','11','12'];
        let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let D = DTSTARTjs
        let dayStr = days[D.getDay()];
        let mStr = months[D.getMonth()];
        let dateStr = D.getDate();
        let hrStr = hours[D.getHours()-1];
        let ampm = D.getHours() < 12 ? 'am' : 'pm';
        let zero = D.getMinutes() < 10 ? "0" : "";
        let minStr = zero + String(D.getMinutes());
        let result = `${dayStr} ${mStr}/${dateStr} ${hrStr}:${minStr}${ampm}`;

        return result;

    } // end createDateString

    // // not implemented
    // setLatestDateFilter (earliestdatefilter,tSpan) {
    //     // tSpan is obj with properties 'unit' and 'number'
    //     return earliestdatefilter;
    // }

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

    filterByEarliest (veventData, earliestdatefilter, latestdatefilter, returnCount) {
        // console.log(items, "in fd");
        let currItems = veventData.filter( (item) => {
            if(!item.RRULE && earliestdatefilter<=this.now) {
                return false;
            } else {
                return true;
            }
        });
        return currItems;
    }  // end filterByEarliest

    processData (rawJSONdata,earliestdatefilter,tSpan,limit) {
        let Vitems = rawJSONdata.VCALENDAR[0].VEVENT;
        let defaultTZID = rawJSONdata.VCALENDAR[0].X-WR-TIMEZONE;
        let newVitemsList = Vitems.map( (item) => {
            //separate dtstart from tzid // if dtstart, tzid = VCALENDAR[0].X-WR-TIMEZONE
            //get JS dates
            //filter by earliest
        })
        //extrapolate from rrrules
        //set up buckets by # limit
        //return first bucket
         = this.filterByEarliest(items);
        JSONdata.VCALENDAR[0].VEVENT = newVeventList;
        return JSONdata;
    }

}

module.exports = new CALMAKER();