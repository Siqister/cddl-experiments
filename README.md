# CDDL Future Mobility: Visualization Sketches

## Installation
Run an http server from the root folder after cloning the repo, such as with `python -m http.server`

## Swarm behavior, explained
Each "card", or particle, in the swarm is governed by 4 motion parameters, which you can interact with through the simple GUI element to the upper right corner of the screen.

### Decay
Each particle has a built-in "shelf life". It will gradually fade in at the beginning, shine brightest at midlife, and fade out at the end. At the end of its shelf life, the particle is brought back to its original position, which ensures that the visualization maintains its original shape over time.

The *decay* parameter governs how quickly a particle's "shelf life" progresses. A higher decay means that particles will generally not stray too far from their original positions, and it will also cause a "twinkling" effect.

### Random walk
Each particle has the built-in tendency to "walk randomly". This parameter controls the speed of this kind of motion.

### Angular speed
Controls the speed at which particles spin around the center.

### Radial speed
Controls the speed at which particles move away from the center. Particles will tend to accelerate from the center, and gradually slow down towards the edge.

## Mixing and matching motion parameters

Because *random walk* and *angular speed* tend to move particles away from their original positions in a circular layout, and *decay* tend to bring them back, they generally counter-act each other.

The following are a few sample sets of paramters and the corresponding visual manifestation:
- *Default*: `decay` = 0.009; `random_walk` = 0.5; `angular_speed` = 1.0; `radial_speed` = 2.0.
- *Random swarm*: everything set to 0 with the exception of `random_walk`. Because `decay` is set to 0, there is no mechanism to bring particles back as they deviate from their intended position. This will stablize into a randomized "carpet" of cards.
- *Fireworks*: `decay` = 0.05; `radial_speed` = 4.0.
