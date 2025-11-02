import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  standalone: false
})
export class NavigationComponent {
  isMobileMenuOpen = false;

  menuItems = [
    {
      label: 'Cartes',
      icon: 'style',
      route: '/cards',
      color: 'primary',
      description: 'Gérer vos cartes de jeu'
    },
    {
      label: 'Actions',
      icon: 'sports_mma',
      route: '/actions',
      color: 'secondary',
      description: 'Créer et modifier les actions'
    },
    {
      label: 'Conditions',
      icon: 'rule',
      route: '/conditions',
      color: 'accent',
      description: 'Définir les conditions de jeu'
    },
    {
      label: 'Effets',
      icon: 'auto_awesome',
      route: '/effects',
      color: 'warn',
      description: 'Gérer les effets spéciaux'
    },
    {
      label: 'Paramètres',
      icon: 'tune',
      route: '/parameters',
      color: 'info',
      description: 'Gérer les définitions de paramètres'
    }
  ];

  constructor() {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    // Fermer le menu mobile si la fenêtre devient plus large
    if (event.target.innerWidth > 768) {
      this.isMobileMenuOpen = false;
    }
  }
}
