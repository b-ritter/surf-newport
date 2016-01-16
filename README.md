### How to Play Phrogger

To play Phrogger, just [click here](http://b-ritter.github.io/frontend-nanodegree-arcade-game/). You can play Phrogger in your browser.

#### Phrogger Options

To select the avatar for your player, click the **Choose Avatar** button. click
on the player style you like.

To just start playing, hit the **start** button.

#### Game Play

To control the player, you use the arrow keys. Move the character one tile at
a time. Your goal is to get to the water before you get hit by the bugs. For
extra points, collect the huge gem.

#### Reset

To go back to the beginning, hit the **Game Reset** button at the bottom of the
screen. Your player selection will be the same, but your score will be set to
zero and the gem will reappear.


#### Development Notes

I learned a lot about organizing code in this project. I hacked it all together
into a working version quickly, but found that there was a lot of repetition
in the code. For example, I made two separate objects to handle the 'win' and
'lose' states that were similar to the rendering functions in the main() loop.
This led me to attempt an abstraction of the main elements in the game. Having
some experience with both Flash and Edge Animate development, I made 'Sprite'
and 'Stage' object which serve as the base for the player, the enemies, the gem
and the different panels: the welcome screen, player selection and the game itself.
This made it much easier to understand, for one thing, as well as add new features.

The other major concept I learned was modeling a Finite State Machine. While the
code is simple (just a conditional in the main() loop), the concept simplified
organization of the code. It allowed the objects to be more separate from each
other, and therefore more flexible. 
