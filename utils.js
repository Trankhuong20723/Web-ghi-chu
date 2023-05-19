this.cookieStringToObject = (str, cookie = {})=>((str || '').split(/;/).forEach(($, i, o, z = $.split(/=/))=>cookie[z[0].trim()] = z[1]), cookie);
this.htmlToText = html=>([[/</g, '&#60;'], [/>/g, '&#62;'], [/"/g, '&#34;'], [/'/g, '&#39;'], [/`/g, '&#96;']].map($=>html = html.replace($[0], $[1])), html);
