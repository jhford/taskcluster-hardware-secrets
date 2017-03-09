%define commitish master
%define nodever v6.10.0
%ifarch i386 i486 i586 i686
%define nodearch linux-x86
%endif
%ifarch x86_64
%define nodearch linux-x64
%endif

Name:		  taskcluster-host-secrets
Version:	1.0.0
Release:	1%{?dist}
Summary:	Taskcluster Host Secrets

Autoreq: 0
Autoprov: 0

Group:		Development/Tools
License:	MPL-2.0
URL:		  https://github.com/taskcluster/%{name}
Source0:	taskcluster-host-secrets.tar.gz
Source1:  https://nodejs.org/dist/%{nodever}/node-%{nodever}-%{nodearch}.tar.xz

%define INST opt/%{name}

%description
Packaging of %{name} for %{nodever} running on %{nodearch}

%prep
mkdir -p code nodejs bin
tar -zxf %{SOURCE0} -C code
tar -Jxf %{SOURCE1}


%build
mv node-%{nodever}-%{nodearch} node
export PATH="$(pwd)/node/bin:$PATH"
node --version
npm --version
sed -e "s,<<<BINDIR>>>,/%{INST}/node/bin," < code/start.sh.in > bin/start.sh
(cd code && npm install)
chmod +x bin/start.sh

%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/%{INST}
cp -r code bin node $RPM_BUILD_ROOT/%{INST}

%files
%defattr(-,root,root,-)
/%{INST}

%changelog

