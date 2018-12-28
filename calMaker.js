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
        let pattern2 = /DTEND/;
        let TZIDend, DTEND;
        for (let key in item) {
            if ( pattern2.test(key) ) {
                TZIDend = key.split('=')[1];
                DTEND = item[key];
            }
        }
        return {
            "DTSTART": DTSTART,
            "TZID": TZID,
            "DTEND": DTEND,
            "TZIDend": TZID,
            "RRULEstr": RRULEstr
        }
    }

    dateStrToLDT (str,tzid) {
        // honestly, still some mystery to me about how this transforms, but it works, i think
        let LDT = DateTime.fromISO(str, {zone: tzid}).toUTC().setZone('local', { keepLocalTime: true });
        return LDT;
    }

    createLocationString (rawLocation) {
        return rawLocation.split('\\').join(' ');
    }

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

    setLateDateFilter (edFilterLDT,tSpan) {
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

    formatVevent (item) {
        let item2 = {};
        item2.dtstart = item.DTSTART;
        item2.tzid = item.TZID;
        item2.uid = item.UID;
        item2.summary = item.SUMMARY;
        item2.location = item.LOCATION;
        item2.description = item.DESCRIPTION;
        item2.occurrences = item.OCCURENCES;
        item2.duration = item.DURATION;
        // console.log(item2);
        return item2;
    }


    // // //
    // // // 
    // // //

    processData (rawJSONdata, earlydatefilter, tSpan) {
        let edFilterLDT = DateTime.fromJSDate(earlydatefilter).toUTC().setZone('local', { keepLocalTime: true });
        let ldFilterLDT = this.setLateDateFilter(edFilterLDT,tSpan);
        let Vitems = rawJSONdata.VCALENDAR[0].VEVENT;
        // bug fix for DTSTART;VALUE=DATE
        let Vitems2 = Vitems.filter( (item) => !item["DTSTART;VALUE=DATE"] );
        let defaultTZID = rawJSONdata.VCALENDAR[0]['X-WR-TIMEZONE'];

        // a method to break out
        // tzid for each item same as general calendar tzid unless specified
        let itemsTZIDsAdded = Vitems2.map( (item) => {
            let item2 = {};
            if (item.DTSTART && !item.TZID) {
                item2.TZID = defaultTZID; //  e.g. 'America/New_York'
            }
            else if (!item.DTSTART) {
                item2 = this.create_DTSTART_TZID_and_RRULEstr(item);
            }
            else if (item.RRULE) {
                item2 = Object.assign(item2, ) ;
            }
            let DTandTZfilledItem = Object.assign(item, item2);
            return DTandTZfilledItem;
        });

        let itemsRRULEstrAdded = itemsTZIDsAdded.map( (item) => {
            if (item.RRULE && !item.RRULEstr) {
                return Object.assign(item, { "RRULEstr": `DTSTART:${item.DTSTART};\nRRULE:${item.RRULE}` } );
            } else {
                return item;
            }
        });

        // a method to break out
        // all items have dtstart and dtend js dates
        let itemsLDTsAdded = itemsRRULEstrAdded.map( (item) => {
            let item2 = {};
            item2.DTSTARTldt = this.dateStrToLDT(item.DTSTART,item.TZID);
            item2.DTENDldt = this.dateStrToLDT(item.DTEND,item.TZID);
            let LDTsAddedItem = Object.assign(item, item2);
            return LDTsAddedItem;
        });

        let itemsDurationAdded = itemsLDTsAdded.map( (item) => {
            let item2 = {};
            let end = item.DTENDldt;
            let start = item.DTSTARTldt;
            item2.DURATION = end.diff(start).toObject();
            return Object.assign(item, item2);
        });

        // filter by edFilterLDT
        let itemsFilteredByEarly = this.filterByEarly(itemsDurationAdded,edFilterLDT);

        // //  // extrapolate from rrules.

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

        // i've made all these functions nouns, but go back through and break them out
        // make them verbs

        let itemsAddOccurrences = function (items) {
            let occAdded = items.map( (item) => {
                let item2 = {};
                let occs = item.rruleObj.between(edFilterLDT.toJSDate(),ldFilterLDT.toJSDate());
                let occurrences = occs.map( (date) => 
                        DateTime
                        .fromJSDate(date, {zone: item.TZID})
                        .setZone('local', { keepLocalTime: true })
                        .toUTC()
                );
                
                item2.OCCURENCES = occurrences;
                return Object.assign(item,item2);
            });
            return occAdded;
        };

        let noRRuleAddOccurence = function (item) {
            // let date = new Date(Date.parse(item.DTSTART));
            let item2 = {};
            let occ = DateTime
                .fromISO(item.DTSTART, {zone: item.TZID})
                .setZone('local', {keepLocalTime: true})
                .toUTC();
            item2.OCCURENCES = [occ];
            return Object.assign(item,item2);
        }

        // filter out those not needed, but push others to itemsRRuleForExtrapolation
        let itemsNoRRule = itemsRRuleObjsAdded.filter((item)=>{
            if (item.rruleObj) {
                if ( item.rruleObj.options.until != null) {
                    let occs = item.rruleObj.all();
                    let all = occs.map( (date) => 
                        DateTime
                        .fromJSDate(date, {zone: item.TZID})
                        // .toUTC()
                        // .setZone('local', { keepLocalTime: true })
                    );
                    if (all.length > 0) {
                        let final = DateTime.fromJSDate(item.rruleObj.options.until);
                        if (final < edFilterLDT) {
                            // recurrence ends before earlydate
                            return false;
                        } else {
                            // recurrence falls within datespan
                            
                            itemsRRuleForExtrapolation.push(item);
                            return false;
                        }
                    // bug fix stuff2 from 2017 with no instances at all, another mystery
                    } else {
                        if (item.DTSTARTldt < edFilterLDT) { // could get rid of if statement?
                            return false;
                        }
                    }
                } else {
                    // has infinite recurrence
                    itemsRRuleForExtrapolation.push(item);
                    return false;
                }
            } else {
                // console.log(item.SUMMARY);
                // has no rrule
                return true;
            }
            console.log('itemsNoRRule did not catch something');
            return false;
        });  // end itemsNoRRule filter
        console.log(itemsNoRRule);
        let itemsNoRRule2 = itemsNoRRule.map(item => noRRuleAddOccurence(item)); 

        // put them together
        
        let itemsOccurencesAdded = itemsAddOccurrences(itemsRRuleForExtrapolation);

        let allShowTimesForFE = itemsNoRRule2.concat(itemsOccurencesAdded);

        let calData = {
            prevEarlyFilter: edFilterLDT.toISO(),
            currEarlyFilter: edFilterLDT.toISO(),
            nextEarlyFilter: ldFilterLDT.toISO(),
            vcalendar: [
                {
                    calName: rawJSONdata.VCALENDAR[0]["X-WR-CALNAME"],
                    timeZone: rawJSONdata.VCALENDAR[0]["X-WR-TIMEZONE"],
                    vevent: allShowTimesForFE.map( item => this.formatVevent(item) )
                }
            ]
        };

        return calData;
    }

}

module.exports = new CALMAKER();

// // // // RAWJSONDATA
// {
//   "id": "hhc1mfvhcajj77n5jcte1gq50s",
//   "status": 200,
//   "message": "OK",
//   "calData": {
//     "VCALENDAR": [
//       {
//         "PRODID": "-//Google Inc//Google Calendar 70.9054//EN",
//         "VERSION": "2.0",
//         "CALSCALE": "GREGORIAN",
//         "METHOD": "PUBLISH",
//         "X-WR-CALNAME": "craig public test",
//         "X-WR-TIMEZONE": "America/New_York",
//         "X-WR-CALDESC": "",
//         "VTIMEZONE": [
//           {
//             "TZID": "Atlantic/Bermuda",
//             "X-LIC-LOCATION": "Atlantic/Bermuda",
//             "DAYLIGHT": [
//               {
//                 "TZOFFSETFROM": "-0400",
//                 "TZOFFSETTO": "-0300",
//                 "TZNAME": "ADT",
//                 "DTSTART": "19700308T020000",
//                 "RRULE": "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU"
//               }
//             ],
//             "STANDARD": [
//               {
//                 "TZOFFSETFROM": "-0300",
//                 "TZOFFSETTO": "-0400",
//                 "TZNAME": "AST",
//                 "DTSTART": "19701101T020000",
//                 "RRULE": "FREQ=YEARLY;BYMONTH=11;BYDAY=1SU"
//               }
//             ]
//           },
//           {
//             "TZID": "Europe/Paris",
//             "X-LIC-LOCATION": "Europe/Paris",
//             "DAYLIGHT": [
//               {
//                 "TZOFFSETFROM": "+0100",
//                 "TZOFFSETTO": "+0200",
//                 "TZNAME": "CEST",
//                 "DTSTART": "19700329T020000",
//                 "RRULE": "FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU"
//               }
//             ],
//             "STANDARD": [
//               {
//                 "TZOFFSETFROM": "+0200",
//                 "TZOFFSETTO": "+0100",
//                 "TZNAME": "CET",
//                 "DTSTART": "19701025T030000",
//                 "RRULE": "FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU"
//               }
//             ]
//           },
//           {
//             "TZID": "America/New_York",
//             "X-LIC-LOCATION": "America/New_York",
//             "DAYLIGHT": [
//               {
//                 "TZOFFSETFROM": "-0500",
//                 "TZOFFSETTO": "-0400",
//                 "TZNAME": "EDT",
//                 "DTSTART": "19700308T020000",
//                 "RRULE": "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU"
//               }
//             ],
//             "STANDARD": [
//               {
//                 "TZOFFSETFROM": "-0400",
//                 "TZOFFSETTO": "-0500",
//                 "TZNAME": "EST",
//                 "DTSTART": "19701101T020000",
//                 "RRULE": "FREQ=YEARLY;BYMONTH=11;BYDAY=1SU"
//               }
//             ]
//           }
//         ],
//         "VEVENT": [
//           {
//             "DTSTART;TZID=Atlantic/Bermuda": "20181119T180000",
//             "DTEND;TZID=Atlantic/Bermuda": "20181119T190000",
//             "RRULE": "FREQ=DAILY;UNTIL=20181220T035959Z",
//             "DTSTAMP": "20181218T060918Z",
//             "UID": "07vkm1ju9s4i5bl9a9m1jbae4v@google.com",
//             "CREATED": "20181125T035903Z",
//             "DESCRIPTION": "",
//             "LAST-MODIFIED": "20181125T041557Z",
//             "LOCATION": "",
//             "SEQUENCE": "2",
//             "STATUS": "CONFIRMED",
//             "SUMMARY": "stuff4",
//             "TRANSP": "OPAQUE",
//             "TZID": "Atlantic/Bermuda",
//             "DTSTART": "20181119T180000",
//             "RRULEstr": "DTSTART;TZID=Atlantic/Bermuda:20181119T180000;\nRRULE:FREQ=DAILY;UNTIL=20181220T035959Z",
//             "DTSTARTldt": "2018-11-19T22:00:00.000-05:00",
//             "DTENDldt": null,
//             "rruleObj": {
//               "_string": null,
//               "_cache": null,
//               "origOptions": {
//                 "freq": 3,
//                 "until": "2018-12-20T03:59:59.000Z",
//                 "dtstart": "2018-11-19T18:00:00.000Z",
//                 "tzid": "Atlantic/Bermuda"
//               },
//               "options": {
//                 "freq": 3,
//                 "until": "2018-12-20T03:59:59.000Z",
//                 "dtstart": "2018-11-19T18:00:00.000Z",
//                 "tzid": "Atlantic/Bermuda",
//                 "interval": 1,
//                 "wkst": 0,
//                 "count": null,
//                 "bysetpos": null,
//                 "bymonth": null,
//                 "bymonthday": [
                  
//                 ],
//                 "bynmonthday": [
                  
//                 ],
//                 "byyearday": null,
//                 "byweekno": null,
//                 "byweekday": null,
//                 "bynweekday": null,
//                 "byhour": [
//                   18
//                 ],
//                 "byminute": [
//                   0
//                 ],
//                 "bysecond": [
//                   0
//                 ],
//                 "byeaster": null
//               },
//               "timeset": [
//                 {
//                   "hour": 18,
//                   "minute": 0,
//                   "second": 0,
//                   "millisecond": 0
//                 }
//               ],
//               "_len": 31
//             },
//             "OCCURENCES": [
//               "2018-12-18T18:00:00.000Z",
//               "2018-12-19T18:00:00.000Z"
//             ]
//           },
//           {
//             "DTSTART;TZID=Europe/Paris": "20181023T170000",
//             "DTEND;TZID=Europe/Paris": "20181023T180000",
//             "RRULE": "FREQ=WEEKLY;BYDAY=TU",
//             "DTSTAMP": "20181218T060918Z",
//             "UID": "01nkipt4026cdqu4uvijjhr1me@google.com",
//             "CREATED": "20181021T195753Z",
//             "DESCRIPTION": "",
//             "LAST-MODIFIED": "20181021T195816Z",
//             "LOCATION": "Paris\\, France",
//             "SEQUENCE": "1",
//             "STATUS": "CONFIRMED",
//             "SUMMARY": "weeklyeventTUE",
//             "TRANSP": "OPAQUE",
//             "TZID": "Europe/Paris",
//             "DTSTART": "20181023T170000",
//             "RRULEstr": "DTSTART;TZID=Europe/Paris:20181023T170000;\nRRULE:FREQ=WEEKLY;BYDAY=TU",
//             "DTSTARTldt": "2018-10-23T15:00:00.000-04:00",
//             "DTENDldt": null,
//             "rruleObj": {
//               "_string": null,
//               "_cache": null,
//               "origOptions": {
//                 "freq": 2,
//                 "byweekday": [
//                   {
//                     "weekday": 1
//                   }
//                 ],
//                 "dtstart": "2018-10-23T17:00:00.000Z",
//                 "tzid": "Europe/Paris"
//               },
//               "options": {
//                 "freq": 2,
//                 "byweekday": [
//                   1
//                 ],
//                 "dtstart": "2018-10-23T17:00:00.000Z",
//                 "tzid": "Europe/Paris",
//                 "interval": 1,
//                 "wkst": 0,
//                 "count": null,
//                 "until": null,
//                 "bysetpos": null,
//                 "bymonth": null,
//                 "bymonthday": [
                  
//                 ],
//                 "bynmonthday": [
                  
//                 ],
//                 "byyearday": null,
//                 "byweekno": null,
//                 "bynweekday": null,
//                 "byhour": [
//                   17
//                 ],
//                 "byminute": [
//                   0
//                 ],
//                 "bysecond": [
//                   0
//                 ],
//                 "byeaster": null
//               },
//               "timeset": [
//                 {
//                   "hour": 17,
//                   "minute": 0,
//                   "second": 0,
//                   "millisecond": 0
//                 }
//               ],
//               "_len": 27
//             },
//             "OCCURENCES": [
//               "2018-12-25T17:00:00.000Z",
//               "2019-01-01T17:00:00.000Z",
//               "2019-01-08T17:00:00.000Z",
//               "2019-01-15T17:00:00.000Z",
//               "2019-01-22T17:00:00.000Z",
//               "2019-01-29T17:00:00.000Z",
//               "2019-02-05T17:00:00.000Z",
//               "2019-02-12T17:00:00.000Z",
//               "2019-02-19T17:00:00.000Z",
//               "2019-02-26T17:00:00.000Z",
//               "2019-03-05T17:00:00.000Z",
//               "2019-03-12T17:00:00.000Z",
//               "2019-03-19T17:00:00.000Z",
//               "2019-03-26T17:00:00.000Z",
//               "2019-04-02T17:00:00.000Z",
//               "2019-04-09T17:00:00.000Z",
//               "2019-04-16T17:00:00.000Z"
//             ]
//           },
//           {
//             "DTSTART;TZID=America/New_York": "20160604T210000",
//             "DTEND;TZID=America/New_York": "20160604T230000",
//             "RRULE": "FREQ=WEEKLY",
//             "DTSTAMP": "20181218T060918Z",
//             "UID": "0oko40419m2uk56fo3j4l6ujvi@google.com",
//             "CREATED": "20180727T141727Z",
//             "DESCRIPTION": "Like: www.bit.ly/dopeshow\\nHashtag: #DopeNY\\nTwitter: http://twitter.com/berrey\\nInstagram: http://instagram.com/berrey ",
//             "LAST-MODIFIED": "20180727T141727Z",
//             "LOCATION": "Park View Bar & Restaurant\\, 219 Dyckman St\\, New York\\, NY 10034 ",
//             "SEQUENCE": "0",
//             "STATUS": "CONFIRMED",
//             "SUMMARY": "Dope (a free weekly comedy show)",
//             "TRANSP": "OPAQUE",
//             "TZID": "America/New_York",
//             "DTSTART": "20160604T210000",
//             "RRULEstr": "DTSTART;TZID=America/New_York:20160604T210000;\nRRULE:FREQ=WEEKLY",
//             "DTSTARTldt": "2016-06-05T01:00:00.000-04:00",
//             "DTENDldt": null,
//             "rruleObj": {
//               "_string": null,
//               "_cache": null,
//               "origOptions": {
//                 "freq": 2,
//                 "dtstart": "2016-06-04T21:00:00.000Z",
//                 "tzid": "America/New_York"
//               },
//               "options": {
//                 "freq": 2,
//                 "dtstart": "2016-06-04T21:00:00.000Z",
//                 "tzid": "America/New_York",
//                 "interval": 1,
//                 "wkst": 0,
//                 "count": null,
//                 "until": null,
//                 "bysetpos": null,
//                 "bymonth": null,
//                 "bymonthday": [
                  
//                 ],
//                 "bynmonthday": [
                  
//                 ],
//                 "byyearday": null,
//                 "byweekno": null,
//                 "byweekday": [
//                   5
//                 ],
//                 "bynweekday": null,
//                 "byhour": [
//                   21
//                 ],
//                 "byminute": [
//                   0
//                 ],
//                 "bysecond": [
//                   0
//                 ],
//                 "byeaster": null
//               },
//               "timeset": [
//                 {
//                   "hour": 21,
//                   "minute": 0,
//                   "second": 0,
//                   "millisecond": 0
//                 }
//               ],
//               "_len": 151
//             },
//             "OCCURENCES": [
//               "2018-12-22T21:00:00.000Z",
//               "2018-12-29T21:00:00.000Z",
//               "2019-01-05T21:00:00.000Z",
//               "2019-01-12T21:00:00.000Z",
//               "2019-01-19T21:00:00.000Z",
//               "2019-01-26T21:00:00.000Z",
//               "2019-02-02T21:00:00.000Z",
//               "2019-02-09T21:00:00.000Z",
//               "2019-02-16T21:00:00.000Z",
//               "2019-02-23T21:00:00.000Z",
//               "2019-03-02T21:00:00.000Z",
//               "2019-03-09T21:00:00.000Z",
//               "2019-03-16T21:00:00.000Z",
//               "2019-03-23T21:00:00.000Z",
//               "2019-03-30T21:00:00.000Z",
//               "2019-04-06T21:00:00.000Z",
//               "2019-04-13T21:00:00.000Z"
//             ]
//           }
//         ]
//       }
//     ]
//   }
// }


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