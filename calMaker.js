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

    // splitting up  DTSTART TZID and RRULE
    create_DTSTART_TZID_and_RRULEstr (item) {
        let pattern = /DTSTART/;
        let TZID, DTSTART, RRULEstr;
        for (let key in item) {
            if ( pattern.test(key) ) {
                TZID = key.split('=')[1];
                DTSTART = item[key];
                RRULEstr = `${key}:${item[key]};\nRRULE:${item['RRULE']}`;
            }
        }
        return {
            "TZID": TZID,
            "DTSTART": DTSTART,
            "RRULEstr": RRULEstr
        }
    }

    create_DTEND_and_TZIDend (item) {
        let pattern = /DTEND/;
        let DTEND, TZIDend;
        for (let key in item) {
            if ( pattern.test(key) ) {
                TZIDend = key.split('=')[1];
                DTEND = item[key];
            }
        }
        return {
            "TZIDend": TZIDend,
            "DTEND": DTEND
        }
    }

    dateStrToJSDate (str) {
        let y = str.substr(0,4);
        let m = str.substr(4,2) - 1;
        let d = str.substr(6,2);
        let hr = str.substr(9,2);
        let min = str.substr(11,2);
        return new Date(y,m,d,hr,min);
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

    createDateDisplayString (DTSTARTjs) {
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

    } // end createDateDisplayString

    // * not implemented
    setLatestDateFilter (earlydatefilter,tSpan) {
        // tSpan is obj with properties 'unit' and 'number'
        return earlydatefilter;
    }

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

    filterByEarly (items, earlydatefilter) {
        let currItems = items.filter( (item) => {
            if(!item.RRULE &&  item.DTSTARTjs <= earlydatefilter) {
                return false;
            } else {
                return true;
            }
        });
        return currItems;
    }  // end filterByEarly

    processData (rawJSONdata,earlydatefilter,tSpan,limit,locale) {
        let Vitems = rawJSONdata.VCALENDAR[0].VEVENT;
        let defaultTZID = rawJSONdata.VCALENDAR[0]['X-WR-TIMEZONE'];
        // tzid for each item same as general calendar tzid unless specified
        let itemsWithTZIDs = Vitems.map( (item) => {
            let item2 = {};
            if (item.DTSTART && !item.TZID) {
                item2.TZID = defaultTZID; //  e.g. 'America/New_York'
            }
            else if (!item.DTSTART) {
                item2 = Object.assign(item2, this.create_DTSTART_TZID_and_RRULEstr(item));
            }
            if (item.DTEND) {
                item2.TZIDend = defaultTZID;
            }
            else if (!item.DTEND) {
                item2 = Object.assign(item2, this.create_DTEND_and_TZIDend(item));
            }
            let DTandTZfilledItem = Object.assign(item, item2);
            return DTandTZfilledItem;
        });
        // all items have dtstart and dtend js dates
        let itemsWithDTjs = itemsWithTZIDs.map( (item) => {
            let item2 = {};
            if (item.DTSTART.substr(-1) === 'Z') {
                item2.DTSTARTjs = this.utcDateStrToJSDate(item.DTSTART);
            }
            else {
                item2.DTSTARTjs = this.dateStrToJSDate(item.DTSTART);
            }
            if (item.DTEND.substr(-1) === 'Z') {
                item2.DTENDjs = this.utcDateStrToJSDate(item.DTEND);
            }
            else {
                item2.DTENDjs = this.dateStrToJSDate(item.DTEND);
            }
            let DTjsFilledItem = Object.assign(item, item2);
            return DTjsFilledItem;
        });
        //filter by earlydatefilter
        let itemsFilteredByEarly = this.filterByEarly(itemsWithDTjs,earlydatefilter);

        // // extrapolate from rrules.
        // for items with rrules, create rruleObj.
        // filter out those with count or until which do not reach today.
        // with the rest, whether they are infinite or do reach today, include them,
        //  applying the timespan/latedate filter.
        // we need some helpers:
        // * get last occurance of those which reoccur.  how does it compare to latedate filter?
        // * get slice of those which are infinite.  compare to early and latedate filter.

        rawJSONdata.VCALENDAR[0].VEVENT = itemsFilteredByEarly;
        return rawJSONdata;
    }

}

module.exports = new CALMAKER();


// // how to luxon timedate with zone
// DateTime.fromJSDate(JSDate, { zone: "Europe/Paris" });


// // Create a rule:
// const rule = new RRule({
//   freq: RRule.WEEKLY,
//   interval: 5,
//   byweekday: [RRule.MO, RRule.FR],
//   dtstart: new Date(Date.UTC(2012, 1, 1, 10, 30)),
//   until: new Date(Date.UTC(2012, 12, 31))
// })

// // Get all occurrence dates (Date instances):
// rule.all()
// [ '2012-02-03T10:30:00.000Z',
//   '2012-03-05T10:30:00.000Z',
//   '2012-03-09T10:30:00.000Z',
//   '2012-04-09T10:30:00.000Z',
//   '2012-04-13T10:30:00.000Z',
//   '2012-05-14T10:30:00.000Z',
//   '2012-05-18T10:30:00.000Z',

//  /* … */]

// // Get a slice:
// rule.between(new Date(Date.UTC(2012, 7, 1)), new Date(Date.UTC(2012, 8, 1)))
// ['2012-08-27T10:30:00.000Z',
//  '2012-08-31T10:30:00.000Z']

// // Parse a RRule string, return a RRule object
// rrulestr('DTSTART:20120201T023000Z\nRRULE:FREQ=MONTHLY;COUNT=5')