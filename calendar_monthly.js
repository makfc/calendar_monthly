/* Magic Mirror Module: calendar_monthly
 * v1.0 - June 2016
 *
 * By Ashley M. Kirchner <kirash4@gmail.com>
 * Beer Licensed (meaning, if you like this module, feel free to have a beer on me, or send me one.)
 */

Module.register("calendar_monthly", {

	// Module defaults
	defaults: {
		debugging:		false,
		initialLoadDelay:	0,		// How many seconds to wait on a fresh start up.
							// This is to prevent collision with all other modules also
							// loading all at the same time. This only happens once,
							// when the mirror first starts up.
		fadeSpeed:		2,		// How fast (in seconds) to fade out and in during a midnight refresh
		showHeader:		true,		// Show the month and year at the top of the calendar
		cssStyle:		"block",	// which CSS style to use, 'block', 'slate', or 'custom'
		updateDelay:		5,		// How many seconds after midnight before a refresh
							// This is to prevent collision with other modules refreshing
							// at the same time.
	},

	// Required styles
	getStyles: function() {
		return [this.data.path + "/css/mcal.css", this.getThemeCss()];
	},

	getThemeCss: function() {
		return this.data.path + "/css/themes/" + this.config.cssStyle + ".css";
	},

	// Required scripts
	getScripts: function() {
		return ["moment.js"];
	},

	moment: function() {
		// For Debug CALENDAR_EVENTS
		// const now = moment();
		// return moment([now.year(), 11, 25]);

		return moment();
	},

	// Override start method
	start: function() {
		Log.log("Starting module: " + this.name);
		// Set locale
		moment.locale(config.language);

		this.scheduleUpdate(this.config.initialLoadDelay * 1000);
	},

	// Override dom generator
	getDom: function() {
		var year = this.moment().year();
		var monthName = this.moment().format("MMM");
		var monthLength = this.moment().daysInMonth();

		// Find first day of the month, LOCALE aware
		var startingDay = this.moment().date(1).weekday();

		var wrapper = document.createElement("table");
		wrapper.className = 'xsmall';
		wrapper.id = 'calendar-table';

		// Create THEAD section with month name and 4-digit year
		var header = document.createElement("tHead");
		var headerTR = document.createElement("tr");

		// We only fill in the THEAD section if the .showHeader config is set to true
		if (this.config.showHeader) {
			var headerTH = document.createElement("th");
			headerTH.colSpan = "7";
			headerTH.scope = "col";
			headerTH.id = "calendar-th";
			var headerMonthSpan = document.createElement("span");
			headerMonthSpan.id = "monthName";
			headerMonthSpan.innerHTML = monthName;
			var headerYearSpan = document.createElement("span");
			headerYearSpan.id = "yearDigits";
			headerYearSpan.innerHTML = year;
			// Add space between the two elements
			// This can be used later with the :before or :after options in the CSS
			var headerSpace = document.createTextNode(" ");

			headerTH.appendChild(headerMonthSpan);
			headerTH.appendChild(headerSpace);
			headerTH.appendChild(headerYearSpan);
			headerTR.appendChild(headerTH);
		}
		header.appendChild(headerTR);
		wrapper.appendChild(header);

		// Create TFOOT section -- currently used for debugging only
		var footer = document.createElement('tFoot');
		var footerTR = document.createElement("tr");
		footerTR.id = "calendar-tf";

		var footerTD = document.createElement("td");
		footerTD.colSpan ="7";
		footerTD.className = "footer";
		if (this.config.debugging) {
			footerTD.innerHTML = "Calendar currently in DEBUG mode!<br />Please see console log.";
		} else {
			footerTD.innerHTML = "&nbsp;";
		}

		footerTR.appendChild(footerTD);
		footer.appendChild(footerTR);
		wrapper.appendChild(footer);

		// Create TBODY section with day names
		var bodyContent = document.createElement("tBody");
		var bodyTR = document.createElement("tr");
		bodyTR.id = "calendar-header";

		for (var i = 0; i <= 6; i++ ){
			var bodyTD = document.createElement("td");
			bodyTD.className = "calendar-header-day";
			bodyTD.innerHTML = this.moment().weekday(i).format("dd");
			bodyTR.appendChild(bodyTD);
		}
		bodyContent.appendChild(bodyTR);
		wrapper.appendChild(bodyContent);

		// Create TBODY section with the monthly calendar
		var bodyContent = document.createElement("tBody");
		var bodyTR = document.createElement("tr");
		bodyTR.className = "weekRow";

		// Fill in the days
		var day = 1;
		var nextMonth = 1;
		// Loop for amount of weeks (as rows)
		for (var i = 0; i < 9; i++) {
			// Loop for each weekday (as individual cells)
			for (var j = 0; j <= 6; j++) {
				var bodyTD = document.createElement("td");
				bodyTD.className = "calendar-day";
				var squareDiv = document.createElement("div");
				squareDiv.className = "square-box";
				var squareContent = document.createElement("div");
				squareContent.className = "square-content";
				var squareContentInner = document.createElement("div");
				var innerSpan = document.createElement("span");

				var momentDay;
				if (j < startingDay && i == 0) {
					momentDay = this.moment().subtract(1, 'months').endOf('month').subtract((startingDay - 1) - j, 'days');
					// First row, fill in empty slots
					innerSpan.className = "monthPrev";
					innerSpan.innerHTML = momentDay.date();
				} else if (day <= monthLength && (i > 0 || j >= startingDay)) {
					momentDay = this.moment().date(day);
					if (momentDay.isSame(this.moment(), 'day')) {
						innerSpan.id = "day" + day;
						innerSpan.className = "today";
					} else {
						innerSpan.id = "day" + day;
						innerSpan.className = "daily";
					}
					if (j === 0) {
						innerSpan.style.color = 'red'; // Sunday
					}
					innerSpan.innerHTML = day;
					day++;
				} else if (day > monthLength && i > 0) {
					momentDay = this.moment().endOf('month').add(nextMonth, 'days');
					// Last row, fill in empty space
					innerSpan.className = "monthNext";
					innerSpan.innerHTML = momentDay.date();
					nextMonth++;
				}

				// Add event to momentDay
				var dayEvents = (this.events || []).filter(function (event) {
					return momentDay.isSame(event.startDate, 'day') || momentDay.isBetween(event.startDate, event.endDate, 'day', "[)");
				});
				if (dayEvents.length !== 0) {
					innerSpan.className = innerSpan.className + " events";
					innerSpan.style = "--event-count: " + dayEvents.length + "; --event-color: " + dayEvents[0].color;
					innerSpan.innerHTML += `<div style="font-size: small">${dayEvents[0].title}</div>`;
				}
				squareContentInner.appendChild(innerSpan);
				squareContent.appendChild(squareContentInner);
				squareDiv.appendChild(squareContent);
				bodyTD.appendChild(squareDiv);
				bodyTR.appendChild(bodyTD);
			}
			// Don't need any more rows if we've run out of days
			if (day > monthLength) {
				break;
			} else {
				bodyTR.appendChild(bodyTD);
				bodyContent.appendChild(bodyTR);
				var bodyTR = document.createElement("tr");
				bodyTR.className = "weekRow";
			}
		}

		bodyContent.appendChild(bodyTR);
		wrapper.appendChild(bodyContent);

		this.loaded = true;
		return wrapper;
	},

	scheduleUpdate: function(initialDelay = 0) {
        let nextUpdate = this.moment().startOf('day').add({ days: 1, seconds: this.config.updateDelay + initialDelay});
        let timeout = nextUpdate.diff(this.moment());
        setTimeout(() => {
           this.update();
		}, timeout);
		if (this.config.debugging) {
			Log.info(`Current time: ${this.moment()}`);
        	Log.info(`${this.name} Next update scheduled at ${nextUpdate} which is in exactly ${timeout}ms`);
		}

    },

	update: function() {
        this.updateDom(this.config.fadeSpeed * 1000);
        this.scheduleUpdate();
    },

	notificationReceived: function(notification, payload, sender) {
		var self = this;
		if (notification == "CALENDAR_EVENTS") {
			var result = [];
			for (event of payload) {
				var startDate = moment(parseInt(event.startDate));
				var endDate = moment(parseInt(event.endDate));

				result.push({
					startDate : startDate,
					endDate: endDate,
					color: event.color,
					title: event.title
				});
			}
			self.events = result;
			self.loaded = false;

			self.updateDom(this.config.fadeSpeed * 1000);
		}
	}
});
