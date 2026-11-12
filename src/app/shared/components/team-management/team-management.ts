import { Component, Input } from '@angular/core';

type MemberStatus = 'Ativo' | 'Em folga';

interface TeamMember {
  name: string;
  role: string;
  email: string;
  phone: string;
  status: MemberStatus;
  initials: string;
  color: string;
}

@Component({
  selector: 'app-team-management',
  styleUrl: './team-management.css',
  templateUrl: './team-management.html',
})
export class TeamManagement {
  @Input() searchTerm = '';

  protected readonly members: TeamMember[] = [
    {
      name: 'Thiago Souza',
      role: 'Administrador',
      email: 'thiago@doceetrigo.example',
      phone: '(11) 99912-3456',
      status: 'Ativo',
      initials: 'TS',
      color: 'sand',
    },
    {
      name: 'Ana Paula Mendes',
      role: 'Confeiteira',
      email: 'ana@doceetrigo.example',
      phone: '(11) 99876-5432',
      status: 'Ativo',
      initials: 'AM',
      color: 'rose',
    },
    {
      name: 'Lucas Ferreira',
      role: 'Padeiro',
      email: 'lucas@doceetrigo.example',
      phone: '(11) 99765-4321',
      status: 'Ativo',
      initials: 'LF',
      color: 'green',
    },
    {
      name: 'Mariana Costa',
      role: 'Atendimento',
      email: 'mariana@doceetrigo.example',
      phone: '(11) 99654-3210',
      status: 'Em folga',
      initials: 'MC',
      color: 'lilac',
    },
    {
      name: 'Pedro Henrique',
      role: 'Auxiliar de cozinha',
      email: 'pedro@doceetrigo.example',
      phone: '(11) 99543-2109',
      status: 'Ativo',
      initials: 'PH',
      color: 'blue',
    },
  ];

  protected get filteredMembers(): TeamMember[] {
    const query = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    return this.members.filter(
      (member) =>
        !query ||
        `${member.name} ${member.role} ${member.email} ${member.status}`
          .toLocaleLowerCase('pt-BR')
          .includes(query),
    );
  }
}
