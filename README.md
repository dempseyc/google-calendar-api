# google-calendar-api
## get ics from google, expand data and return json.

My user wants their public google calendar to feed into their website as a list of occasions with links.  I could use the google calender API as it's intended, if I have a service account and want to access it that way, or I can do it this way:  Making a request to something like "http://calendar.google.com/calendar/ical/"+calID+"%40group.calendar.google.com/public/basic.ics".
This way, I get an .ICS file, convert it to JSON, and work with the data in javascript as I wish, without a service account, and, Hey, what a great exercise of freedom within this context!

Imagine an entertainer on tour. They go around the globe, scheduling dates and travel, and they don't really want to bother with anything more complex than their google calendar.  I, as an engineer, don't want to get into the administrative duties of a Google Service Account for this project. Nothing wrong with Google Service Accounts, just not seemingly necessary to me just to share a public calendar, so I build this thing.

I have a tiny express.js server accepting requests from a single client, the entertainer's website.  My server hits the google api, gets the ics file, massages the data, and sends back a JSON array of occasions that fit into the Front End perfectly.  What else could one possibly want?

When I say "massages data," this is the hard part.  Using timezones, recurrence rules, daylight savings, limiting, filtering... see the code and libraries for details.  I'll keep cleaning it all up and adjusting the readme to match as I go.





