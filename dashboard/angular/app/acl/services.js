/**
 * Created by payamyousefi on 2/15/15.
 */
app.service('AclService', [
  '$uibModal',
  '$log',
  '$q',
  '$location',
  'PREFIX',
  'Business',
  'Session',
  'translateFilter',
  function(
    $uibModal,
    $log,
    $q,
    $location,
    PREFIX,
    Business,
    Session,
    translateFilter
  ) {
    this.checkIfPermitted = function(action, clbk, option) {
      var buyPremium = translateFilter('general.buyPremium');
      var buyLogModule = translateFilter('general.buyLogModule');
      var buyMemberPanelModule = translateFilter(
        'general.buyMemberPanelModule'
      );
      var buyPaymentModule = translateFilter('general.buyPaymentModule');

      var businessPlanId;
      if (Session.business.services) {
        //todo: check with payam: 'free' is replaced with 'economic' in order to cover old package ids
        businessPlanId = Session.business.services.id || 'economic';
        //todo: check with payam: this conditional is added in order to cover old package ids
        if (
          !businessPlanId ||
          businessPlanId === 'premium' ||
          businessPlanId === 'silver' ||
          businessPlanId === 'gold' ||
          businessPlanId === 'bronze' ||
          businessPlanId === 'free'
        ) {
          businessPlanId = 'economic';
        }
      } else {
        businessPlanId = 'economic';
      }

      var availablePackages = {
        economic: {
          addMessageSignature: true,
          validateNasIpSrcPacket: true,
          bindMemberToMac: true,
          enableVerificationByCall: true,
          enablePayment: true,
          enablePanel: true,
          enableSecondPassword: true,
          enableUnfilteredSms: true,
          addTicket: true,
          changeLogo: true,
          sendBulkSms: true,
          uploadMembers: true,
          uploadLogo: true,
          customizeHotspotForm: true,
          enableDropbox: true
        },
        economic6: {
          addMessageSignature: true,
          validateNasIpSrcPacket: true,
          bindMemberToMac: true,
          enableVerificationByCall: true,
          enablePayment: true,
          enablePanel: true,
          enableSecondPassword: true,
          enableUnfilteredSms: true,
          addTicket: true,
          changeLogo: true,
          sendBulkSms: true,
          uploadMembers: true,
          uploadLogo: true,
          customizeHotspotForm: true,
          enableDropbox: true
        },
        economic12: {
          addMessageSignature: true,
          validateNasIpSrcPacket: true,
          bindMemberToMac: true,
          enableVerificationByCall: true,
          enablePayment: true,
          enablePanel: true,
          enableSecondPassword: true,
          enableUnfilteredSms: true,
          addTicket: true,
          changeLogo: true,
          sendBulkSms: true,
          uploadMembers: true,
          uploadLogo: true,
          customizeHotspotForm: true,
          enableDropbox: true
        }
      };

      if (action === 'addMessageSignature') {
        if (availablePackages[businessPlanId].addMessageSignature) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'validateNasIpSrcPacket') {
        if (availablePackages[businessPlanId].validateNasIpSrcPacket) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'bindMemberToMac') {
        if (availablePackages[businessPlanId].bindMemberToMac) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'enableVerificationByCall') {
        if (availablePackages[businessPlanId].enableVerificationByCall) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'enableUnfilteredSms') {
        if (availablePackages[businessPlanId].enableUnfilteredSms) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'addTicket') {
        if (availablePackages[businessPlanId].addTicket) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'changeLogo') {
        if (availablePackages[businessPlanId].changeLogo) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'enablePayment') {
        if (availablePackages[businessPlanId].enablePayment) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPaymentModule });
        }
      } else if (action === 'uploadMembers') {
        if (availablePackages[businessPlanId].uploadMembers) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'sendBulkSms') {
        if (availablePackages[businessPlanId].sendBulkSms) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'enableSecondPassword') {
        if (availablePackages[businessPlanId].enableSecondPassword) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'enablePanel') {
        if (availablePackages[businessPlanId].enablePanel) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyMemberPanelModule });
        }
      } else if (action === 'uploadLogo') {
        if (availablePackages[businessPlanId].uploadLogo) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'customizeHotspotForm') {
        if (availablePackages[businessPlanId].customizeHotspotForm) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyPremium });
        }
      } else if (action === 'enableDropbox') {
        if (availablePackages[businessPlanId].enableDropbox) {
          return clbk({ isPermitted: true });
        } else {
          return clbk({ isPermitted: false, message: buyLogModule });
        }
      } else {
        return clbk({ isPermitted: true });
      }

      function countNas(businessId, clbk) {
        Business.nas.count({ id: businessId }).$promise.then(
          function(result) {
            return clbk(null, result.count);
          },
          function(error) {
            return clbk(error);
          }
        );
      }
    };
  }
]);
