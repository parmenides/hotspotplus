/**
 * Created by hamidehnouri on 11/29/2016 AD.
 */

app.service( 'campaignService', [ '$log', function ( $log ) {
	this.getCampaigns = function () {
		return {
			'birthday':         {
				'times':       {
					'rightNow':   {
						'title':       'campaign.rightNow',
						'description': 'campaign.rightNowDescription'
					}
				},
				'title':       'campaign.birthday',
				'description': 'campaign.birthdayDescription',
				'steps':       [ 'chooseCampaign', 'chooseMessage', 'chooseDuration', 'confirmSave' ],
				'disabled':    false
			},
			'loyalty':         {
				'times':       {
					'rightNow':   {
						'title':       'campaign.rightNow',
						'description': 'campaign.rightNowDescription'
					}
				},
				'title':       'campaign.loyalty',
				'description': 'campaign.loyaltyDescription',
				'steps':       [ 'chooseCampaign', 'chooseMessage', 'chooseDuration', 'confirmSave' ],
				'disabled':    false
			},
			'memberAtRisk':       {
				'times':       {
					'rightNow': {
						'title':       'campaign.rightNow',
						'description': 'campaign.rightNowDescription'
					}
				},
				'title':       'campaign.memberAtRisk',
				'description': 'campaign.memberAtRiskDescription',
				'steps':       [ 'chooseCampaign', 'chooseMessage', 'chooseDuration', 'confirmSave' ],
				'disabled':    false
			},
			'sendBulkMessage':         {
				'times':       {
					'rightNow':   {
						'title':       'campaign.rightNow',
						'description': 'campaign.rightNowDescription'
					},
					'onEntrance': {
						'title':       'campaign.onEntrance',
						'description': 'campaign.onEntranceDescription'
					},
					'onExit':     {
						'title':       'campaign.onExit',
						'description': 'campaign.onExitDescription'
					}
				},
				'title':       'campaign.sendBulkMessage',
				'description': 'campaign.sendBulkMessageDescription',
				'steps':       [ 'chooseCampaign', 'chooseMessage', 'chooseDuration', 'confirmSave'  ],
				'disabled':    false
			},
			'customerAcquisition': {
				'times':       {
					'rightNow': {
						'title':       'campaign.onSignup',
						'description': 'campaign.rightNowDescription'
					}
				},
				'title':       'campaign.customerAcquisition',
				'description': 'campaign.customerAcquisitionDescription',
				'steps':       [ 'chooseCampaign', 'chooseMessage', 'chooseDuration', 'confirmSave' ],
				'disabled': true
			},
			'proximity':           {
				'times':       {
					'rightNow': {
						'title':       'campaign.onSee',
						'description': 'campaign.rightNowDescription'
					}
				},
				'title':       'campaign.proximity',
				'description': 'campaign.proximityDescription',
				'steps':       [ 'chooseCampaign', 'chooseMessage', 'chooseDuration', 'confirmSave' ],
				'disabled':    true
			},
			'inviteFriend':        {
				'times':       {
					'rightNow':   {
						'title':       'campaign.rightNow',
						'description': 'campaign.rightNowDescription'
					},
					'onEntrance': {
						'title':       'campaign.onEntrance',
						'description': 'campaign.onEntranceDescription'
					},
					'onExit':     {
						'title':       'campaign.onExit',
						'description': 'campaign.onExitDescription'
					}
				},
				'title':       'campaign.inviteFriend',
				'description': 'campaign.inviteFriendDescription',
				'steps':       [ 'chooseCampaign', 'chooseMessage', 'chooseDuration', 'confirmSave' ],
				'disabled':    true
			}
		}
	}
} ] );
