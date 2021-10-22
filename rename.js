const fs = require('fs');
const {join} =require('path');
const base = 'data';


const shoulderTats = fs.readdirSync(join(__dirname, base, 'Head Side Tattoo'));

console.log(__dirname)

shoulderTats.forEach(w => {
  const name = w.split(' Cheek.png')[0];
  if (name) {
    fs.renameSync(
      join(__dirname, base, 'Head Side Tattoo',  w), 
      join(__dirname, base, 'Head Side Tattoo', name + '.png')
    )
  }
});

