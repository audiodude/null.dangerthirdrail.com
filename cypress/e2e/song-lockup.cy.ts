describe('SongLockup', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('renders all songs', () => {
    cy.get('.nr-song').should('have.length.at.least', 3);
  });

  it('each song has a title and play button', () => {
    cy.get('.nr-song').each(($song) => {
      cy.wrap($song).find('h2').should('exist');
      cy.wrap($song).find('button[aria-label="Play"]').should('exist');
    });
  });

  it('shows version tabs for multi-version songs', () => {
    cy.get('#salsa-shekel').find('a').filter('[href*="/version/"]').should('have.length.at.least', 2);
  });

  it('clicking play starts playback', () => {
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel audio').should(($audio) => {
      expect(($audio[0] as HTMLAudioElement).paused).to.be.false;
    });
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');
  });

  it('clicking pause stops playback', () => {
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').first().click();
    cy.get('#salsa-shekel audio').should(($audio) => {
      expect(($audio[0] as HTMLAudioElement).paused).to.be.true;
    });
  });

  it('only one song plays at a time', () => {
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');

    cy.get('#skin button[aria-label="Play"]').first().click();
    cy.get('#skin button[aria-label="Pause"]').should('exist');
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('not.exist');
  });
});

describe('Version tabs', () => {
  it('switching tabs changes the active version', () => {
    cy.visit('/');
    cy.get('#salsa-shekel a').contains('Full Thing').click();
    cy.location('hash').should('contain', 'Full%20Thing');
    cy.get('#salsa-shekel a').contains('Full Thing')
      .should('have.css', 'background-color')
      .and('not.equal', 'rgb(55, 65, 81)');
  });

  it('switching tabs while playing continues playback', () => {
    cy.visit('/');
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');

    cy.get('#salsa-shekel a').contains('Full Thing').click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');
    cy.get('#salsa-shekel audio').should(($audio) => {
      expect(($audio[0] as HTMLAudioElement).paused).to.be.false;
    });
  });
});

describe('Fragment URLs', () => {
  it('scrolls to song from #songId fragment', () => {
    cy.visit('/#salsa-shekel');
    cy.get('#salsa-shekel').should('be.visible');
  });

  it('selects version from fragment', () => {
    cy.visit('/#salsa-shekel/version/Remix');
    cy.get('#salsa-shekel a').contains('Remix')
      .should('have.css', 'background-color')
      .and('not.equal', 'rgb(55, 65, 81)');
  });

  it('handles %20 in version names', () => {
    cy.visit('/#salsa-shekel/version/Full%20Thing');
    cy.get('#salsa-shekel a').contains('Full Thing')
      .should('have.css', 'background-color')
      .and('not.equal', 'rgb(55, 65, 81)');
  });

  it('auto-plays from fragment on fresh load', () => {
    cy.visit('/#salsa-shekel/version/Sample');
    cy.get('#salsa-shekel audio', { timeout: 5000 }).should(($audio) => {
      expect(($audio[0] as HTMLAudioElement).paused).to.be.false;
    });
  });

  it('seeks to ?t=N on load', () => {
    cy.visit('/#salsa-shekel/version/Full%20Thing?t=15');
    cy.get('#salsa-shekel audio', { timeout: 8000 })
      .should('have.attr', 'src')
      .and('not.contain', 'sample');
    cy.get('#salsa-shekel audio', { timeout: 8000 }).should(($audio) => {
      const audio = $audio[0] as HTMLAudioElement;
      expect(audio.currentTime).to.be.at.least(14);
    });
  });

  it('seeks to &h= highlight on load', () => {
    cy.visit('/#salsa-shekel/version/Full%20Thing?h=the%20drop');
    cy.get('#salsa-shekel audio', { timeout: 5000 }).should(($audio) => {
      const audio = $audio[0] as HTMLAudioElement;
      expect(audio.currentTime).to.be.at.least(25);
    });
  });
});

describe('Space bar', () => {
  it('pauses the playing song', () => {
    cy.visit('/');
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');

    cy.get('body').type(' ');
    cy.get('#salsa-shekel button[aria-label="Play"]').should('exist');
    cy.get('#salsa-shekel audio').should(($audio) => {
      expect(($audio[0] as HTMLAudioElement).paused).to.be.true;
    });
  });

  it('writes fragment with version on pause', () => {
    cy.visit('/');
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');

    cy.get('body').type(' ');
    cy.location('hash').should('contain', 'salsa-shekel/version/');
  });

  it('resumes playback from fragment', () => {
    cy.visit('/');
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');

    cy.get('body').type(' ');
    cy.get('#salsa-shekel button[aria-label="Play"]').should('exist');

    cy.get('body').type(' ');
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');
  });

  it('does not start a different song while one is playing', () => {
    cy.visit('/');
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');

    cy.get('body').type(' ');
    cy.get('#skin button[aria-label="Pause"]').should('not.exist');
    cy.get('#skin button[aria-label="Play"]').should('exist');
  });
});

describe('Seek fragment updates', () => {
  it('clicking the progress bar writes ?t=N to the fragment', () => {
    cy.visit('/');
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');
    cy.get('#salsa-shekel audio', { timeout: 5000 }).should(($audio) => {
      expect(($audio[0] as HTMLAudioElement).duration).to.be.at.least(5);
    });
    cy.get('#salsa-shekel [data-testid="progress-bar"]').click('right');
    cy.location('hash').should('match', /\?t=\d+/);
  });

  it('clicking a highlight chip writes &h= to the fragment', () => {
    cy.visit('/#salsa-shekel/version/Full%20Thing');
    cy.get('#salsa-shekel button[aria-label="Pause"]', { timeout: 5000 }).should('exist');
    cy.get('body').type(' ');
    cy.get('#salsa-shekel button[aria-label="Play"]').should('exist');

    cy.get('#salsa-shekel button').contains('the drop').click();
    cy.location('hash').should('contain', 'h=the%20drop');
  });
});

describe('Highlights', () => {
  beforeEach(() => {
    cy.visit('/#salsa-shekel/version/Full%20Thing');
    cy.get('#salsa-shekel audio', { timeout: 5000 });
  });

  it('renders highlight chips for versions with highlights', () => {
    cy.get('#salsa-shekel button').contains('the drop').should('exist');
    cy.get('#salsa-shekel button').contains('bridge').should('exist');
  });

  it('clicking a highlight chip seeks and plays', () => {
    cy.get('body').type(' ');
    cy.get('#salsa-shekel button[aria-label="Play"]').should('exist');

    cy.get('#salsa-shekel button').contains('the drop').click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');
    cy.get('#salsa-shekel audio').should(($audio) => {
      const audio = $audio[0] as HTMLAudioElement;
      expect(audio.currentTime).to.be.at.least(25);
    });
  });

  it('does not show highlight chips for versions without highlights', () => {
    cy.get('#salsa-shekel a').contains('Sample').click();
    cy.get('#salsa-shekel button').contains('the drop').should('not.exist');
  });

  it('switching to a version with highlights shows its chips', () => {
    cy.get('#salsa-shekel a').contains('Salsa Shekel (dub').click();
    cy.get('#salsa-shekel button').contains('1-2-3').should('exist');
    cy.get('#salsa-shekel button').contains('the drop').should('not.exist');
  });
});

describe('Share', () => {
  it('has a site-wide share button', () => {
    cy.visit('/');
    cy.get('#share-site').should('contain.text', 'Barbara');
  });

  it('has per-version share buttons', () => {
    cy.visit('/');
    cy.get('#salsa-shekel button[aria-label="Share"]').should('exist');
  });
});

describe('Progress bar', () => {
  it('shows playhead dot when playing', () => {
    cy.visit('/');
    cy.get('#salsa-shekel button[aria-label="Play"]').first().click();
    cy.get('#salsa-shekel button[aria-label="Pause"]').should('exist');

    cy.wait(500);
    cy.get('#salsa-shekel').then(($song) => {
      const dot = $song.find('div[style*="border-radius: 50%"][style*="z-index: 3"]');
      expect(dot.length).to.be.at.least(1);
    });
  });
});
