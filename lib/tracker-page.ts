import shell from '../tracker.html?raw';
import script0 from '../ui/core.js?raw';
import script1 from '../ui/views/dashboard.js?raw';
import script2 from '../ui/views/syllabus.js?raw';
import script3 from '../ui/events.js?raw';
import script4 from '../ui/cloud-sync.js?raw';
import script5 from '../ui/views/themes.js?raw';
import script6 from '../ui/views/timer.js?raw';
import script7 from '../ui/views/groups.js?raw';
import script8 from '../ui/views/calendar.js?raw';
import script9 from '../ui/views/shared-room.js?raw';
import script10 from '../ui/bootstrap.js?raw';
import baseStyles from '../ui/styles/base.css?raw';
import todayStyles from '../ui/styles/today.css?raw';

// Assemble view components into one classic-script scope; no runtime framework needed.
export const trackerPage = shell.replace('/*__STUDYVERSE_STYLES__*/',()=>[baseStyles,todayStyles].join('\n')).replace('/*__STUDYVERSE_SCRIPT__*/',()=>[script0,script1,script2,script3,script4,script5,script6,script7,script8,script9,script10].join('\n'));
