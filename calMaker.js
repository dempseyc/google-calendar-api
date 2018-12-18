const rrulestr = require('rrule').rrulestr;
const { DateTime,Info,Duration,Interval } = require('luxon');

class CALMAKER {

    constructor() {
        this.myNum = 9;
        this.vevent = undefined;
        this.bucketDefinitions = undefined; 
        this.now = DateTime.local();
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

    // splitting up DTSTART TZID and RRULE
    create_DTSTART_TZID_and_RRULEstr (item) {
        let pattern = /DTSTART/;
        let TZID, DTSTART, RRULEstr;
        for (let key in item) {
            if ( pattern.test(key) ) {
                TZID = key.split('=')[1];
                DTSTART = item[key];
                if ( item['RRULE'] ) {
                    RRULEstr = `${key}:${item[key]};\nRRULE:${item['RRULE']}`;
                }
            }
        }
        return {
            "TZID": TZID,
            "DTSTART": DTSTART,
            "RRULEstr": RRULEstr
        }
    }
    // // not used now, but maybe good for next larger context, see above
    // // , maybe add duration as an output at some level of development.
    // create_DTEND_and_TZIDend (item) {
    //     let pattern = /DTEND/;
    //     let DTEND, TZIDend;
    //     for (let key in item) {
    //         if ( pattern.test(key) ) {
    //             TZIDend = key.split('=')[1];
    //             DTEND = item[key];
    //         }
    //     }
    //     return {
    //         "TZIDend": TZIDend,
    //         "DTEND": DTEND
    //     }
    // }

    dateStrToLDT (str,tzid) {
        // honestly, still some mystery to me about how this transforms, but it works, i think
        let LDT = DateTime.fromISO(str, {zone: tzid}).toUTC().setZone('local', { keepLocalTime: true });
        return LDT;
    }

    createLocationString (rawLocation) {
        return rawLocation.split('\\').join(' ');
    }

    // could include locale and more LDT features in here?
    // see how it shakes out
    createDateDisplayString (DTSTARTldt) {
        let months = ['1','2','3','4','5','6','7','8','9','10','11','12'];
        let hours = ['1','2','3','4','5','6','7','8','9','10','11','12','1','2','3','4','5','6','7','8','9','10','11','12'];
        let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let D = DTSTARTldt
        let dayStr = days[D.getDay()];
        let mStr = months[D.getMonth()];
        let dateStr = D.getDate();
        let hrStr = hours[D.getHours()-1];
        let ampm = D.getHours() < 12 ? 'am' : 'pm';
        let zero = D.getMinutes() < 10 ? "0" : "";
        let minStr = zero + String(D.getMinutes());
        let result = `${dayStr} ${mStr}/${dateStr} ${hrStr}:${minStr}${ampm}`;

        return result;
    }

    setLatestDateFilter (edFilterLDT,tSpan) {
        // tSpan default is {unit: 'm', number: 4}
        let unit;
        switch (tSpan.unit) {
            case 'm': unit = 'months';
            break;
            case 'd': unit = 'days';
            break;
            case 'y': unit = 'years';
            break;
        }
        let obj = {};
        obj[unit] = tSpan.number;
        // again, honest, not %100 sure how this transformation works with LDT
        let ldFilterDT = edFilterLDT.plus(obj).toUTC().setZone('local', { keepLocalTime: true });
        return ldFilterDT;
    }

    extractRRULEobj (RRULEstr) {
        let rruleObj = rrulestr(RRULEstr);
        return rruleObj;
    }

    // initial filter for items occurring once and before earlydatefilter
    filterByEarly (items, edFilterLDT) {
        let currItems = items.filter( (item) => {
            if( !item.RRULE && ( item.DTSTARTldt <= edFilterLDT ) ) {
                return false;
            } else {
                return true;
            }
        });
        return currItems;
    }

    // maybe include locale with Luxon stuff
    processData (rawJSONdata, earlydatefilter, tSpan, locale) {
        let edFilterLDT = DateTime.fromJSDate(earlydatefilter).toUTC().setZone('local', { keepLocalTime: true });
        let ldFilterLDT = this.setLatestDateFilter(edFilterLDT,tSpan);
        let Vitems = rawJSONdata.VCALENDAR[0].VEVENT;
        let defaultTZID = rawJSONdata.VCALENDAR[0]['X-WR-TIMEZONE'];

        // a method to break out
        // tzid for each item same as general calendar tzid unless specified
        let itemsTZIDsAdded = Vitems.map( (item) => {
            let item2 = {};
            if (item.DTSTART && !item.TZID) {
                item2.TZID = defaultTZID; //  e.g. 'America/New_York'
            }
            else if (!item.DTSTART) {
                item2 = Object.assign(item2, this.create_DTSTART_TZID_and_RRULEstr(item));
            }
            // // see this.create_DTEND_and_TZIDend()
            // if (item.DTEND) {
            //     item2.TZIDend = defaultTZID;
            // }
            // else if (!item.DTEND) {
            //     item2 = Object.assign(item2, this.create_DTEND_and_TZIDend(item));
            // }
            let DTandTZfilledItem = Object.assign(item, item2);
            return DTandTZfilledItem;
        });

        // a method to break out
        // all items have dtstart and dtend js dates
        let itemsLDTsAdded = itemsTZIDsAdded.map( (item) => {
            let item2 = {};
            item2.DTSTARTldt = this.dateStrToLDT(item.DTSTART,item.TZID);
            item2.DTENDldt = this.dateStrToLDT(item.DTEND,item.TZID);
            let LDTsAddedItem = Object.assign(item, item2);
            return LDTsAddedItem;
        });

        // filter by edFilterLDT
        let itemsFilteredByEarly = this.filterByEarly(itemsLDTsAdded,edFilterLDT);

        // // extrapolate from rrules.

        // a method to break out
        // for items with rrules, create rruleObj.
        let itemsRRuleObjsAdded = itemsFilteredByEarly.map( (item) => {
            let item2 = {};
            if (item.RRULEstr) {
                item2.rruleObj = this.extractRRULEobj(item.RRULEstr);
            }
            let rruleObjCreatedItem = Object.assign(item, item2);
            return rruleObjCreatedItem;
        });

        // where we will store the problem children
        let itemsRRuleForExtrapolation = [];


        let itemsAddOccurrences = function (items) {
            let occAdded = items.map( (item) => {
                let item2 = {};
                let occs = item.rruleObj.between(edFilterLDT.toJSDate(),ldFilterLDT.toJSDate());
                let ocurrences = occs.map( (date) => 
                        DateTime
                        .fromJSDate(date, {zone: item.TZID})
                        .setZone('local', { keepLocalTime: true })
                        .toUTC()
                );
                
                item2.OCCURENCES = ocurrences;
                return Object.assign(item,item2);
            });
            return occAdded;
        };

        // filter out those not needed, but push to itemsRRuleForExtrapolation
        let itemsNoRRule = itemsRRuleObjsAdded.filter((item)=>{
            if (item.rruleObj) {
                if ( item.rruleObj.options.count != null || item.rruleObj.options.until != null) {
                    let occs = item.rruleObj.all();
                    let all = occs.map( (date) => 
                        DateTime
                        .fromJSDate(date, {zone: item.TZID})
                        .toUTC()
                        // .setZone('local', { keepLocalTime: true })
                    );
                    if (all.length > 0) {
                        let final = all[all.length-1].toJSDate();
                        console.log("final", final, item.SUMMARY);
                        if (final < edFilterLDT) {
                            // reocurrence ends before earlydate
                            return false;
                        }
                        else {
                            // reocurrence falls within datespan
                            itemsRRuleForExtrapolation.push(item);
                            return false;
                        }
                    // bug fix stuff2 from 2017 with no instances at all, another mystery
                    } else if (all.length === 0) {
                        if (item.DTSTARTldt < edFilterLDT) { // could get rid of if statement?
                            return false;
                        }
                    }
                } else {
                    // has infinite reocurrence
                    itemsRRuleForExtrapolation.push(item);
                    return false;
                }
            }
            else {
                // has no rrule
                return true;
            }
            console.log('itemsNoRRule did not catch something');
            return false;
        });
        console.log('exit filter');
        
        let itemsOccurencesAdded = itemsAddOccurrences(itemsRRuleForExtrapolation);

        rawJSONdata.VCALENDAR[0].VEVENT = itemsOccurencesAdded;
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