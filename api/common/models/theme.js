import hotspotTemplates from '../../server/modules/hotspotTemplates';
import Q from 'q';

module.exports = function(Theme) {
  Theme.loadHotspotThemes = function() {
    return Q.promise(function(resolve, reject) {
      var themes = hotspotTemplates;
      if (!themes) {
        return reject('hotspot theme undefined');
      }
      return resolve(themes);
    });
  };

  Theme.remoteMethod('loadHotspotThemes', {
    description: 'Load hotspot themes',
    accepts: [],
    returns: { root: true },
  });
};
