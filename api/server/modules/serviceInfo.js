/**
 * Created by payamyousefi on 4/20/17.
 */

module.exports = {
  serviceTemplatesName: [
    'cafeAndRestaurant',
    'hotelsAndPassage',
    'dormitoryAndUniversity',
    'customize',
  ],
  serviceTemplates: {
    cafeAndRestaurant: {onlineUsers: 20},
    hotelsAndPassage: {onlineUsers: 60},
    dormitoryAndUniversity: {onlineUsers: 150},
    customize: {onlineUsers: 20},
  },
  onlineUsersPrice: [{from: 0, to: 1000, price: 400}],
};
