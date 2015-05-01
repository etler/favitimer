#Favitimer

Favitimer is a countdown timer that uses the browser favicon icon and tab title to show you how much time is left on the timer.

##Set Timer via Form

To start a timer fill out the hours, minutes, or seconds that you want, and hit enter or click start. You can pause the timer by clicking on the time left. When the timer completes, it will beep until you click stop.

##Set Timer via Query

You can run a timer through Chrome's tab to search functionality. After you visit favitimer.com, Chrome will create a search entry for the site. Type in favitimer.com, press tab, then type out the time you want to set the timer to. Valid input is in the format of:

* \# s
* \# secs
* \# seconds
* \# m
* \# mins
* \# minutes
* \# h
* \# hrs
* \# hours

Input is flexible and typo tolerant. You can mix and match the formats in any order. If there is no unit, seconds will be assumed. The number value can be any number or a fraction or a decimal.

Examples:

* 30s
* 20 minutes
* 1/2 hr
* .2 hour
* 20 minute 30 seconds 1 hour
* 1h20m30s
* 1 hrs 20minutes 30 s

##Compatibility

Because Favitimer relies on the presence of a favicon, and the ability to update it, IE and Safari are not supported. IE does not allow updating of the browser tab favicon, and Safari does not display a tab favicon at all.
